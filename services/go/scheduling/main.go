// scheduling-service: mock provider slots and consultation bookings.
//
// GET  /slots                — next 7 days of demo provider slots (public)
// POST /bookings             — books a slot, emits booking.confirmed (JWT)
// GET  /bookings             — caller's bookings, newest first (JWT)
// GET  /bookings/{id}        — booking detail (JWT)
// POST /bookings/{id}/cancel — cancels a booking, emits booking.cancelled (JWT)
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	ddbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	ebtypes "github.com/aws/aws-sdk-go-v2/service/eventbridge/types"
	"github.com/google/uuid"

	"github.com/igorjm/levecare/services/go/internal/httpx"
)

type Slot struct {
	ID       string `json:"id"`
	Provider string `json:"provider"`
	CRM      string `json:"crm"`
	StartsAt string `json:"startsAt"`
}

type BookingRequest struct {
	SlotID   string `json:"slotId"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	IntakeID string `json:"intakeId,omitempty"`
}

type Booking struct {
	PK       string `dynamodbav:"pk" json:"-"`
	SK       string `dynamodbav:"sk" json:"-"`
	ID       string `dynamodbav:"id" json:"id"`
	SlotID   string `dynamodbav:"slotId" json:"slotId"`
	Email    string `dynamodbav:"email" json:"email"`
	Name     string `dynamodbav:"name" json:"name"`
	Provider string `dynamodbav:"provider" json:"provider"`
	CRM      string `dynamodbav:"crm,omitempty" json:"crm,omitempty"`
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`
	Status   string `dynamodbav:"status" json:"status"`
	IntakeID string `dynamodbav:"intakeId,omitempty" json:"intakeId,omitempty"`
	Created  string `dynamodbav:"createdAt" json:"createdAt"`
}

// emailSK is the sort key of the per-email booking copy, ordered by start time.
func emailSK(startsAt, id string) string {
	return "BOOKING#" + startsAt + "#" + id
}

// Demo provider roster; a real product would query the medical network.
var providers = []struct{ name, crm string }{
	{"Dra. Ana Souza", "CRM/SC 123456"},
	{"Dr. Carlos Lima", "CRM/SP 654321"},
	{"Dra. Beatriz Rocha", "CRM/RJ 112233"},
}

// slots generates a deterministic set of demo slots for the next 7 days so
// slot IDs remain stable between listing and booking within the same day.
func slots(now time.Time) []Slot {
	var out []Slot
	day := now.Truncate(24 * time.Hour)
	for d := 1; d <= 7; d++ {
		date := day.AddDate(0, 0, d)
		if wd := date.Weekday(); wd == time.Saturday || wd == time.Sunday {
			continue
		}
		for hi, hour := range []int{9, 11, 14, 16} {
			p := providers[(d+hi)%len(providers)]
			start := time.Date(date.Year(), date.Month(), date.Day(), hour, 0, 0, 0, time.UTC)
			out = append(out, Slot{
				ID:       fmt.Sprintf("slot-%s-%02d", start.Format("2006-01-02"), hour),
				Provider: p.name,
				CRM:      p.crm,
				StartsAt: start.Format(time.RFC3339),
			})
		}
	}
	return out
}

func findSlot(id string, now time.Time) *Slot {
	for _, s := range slots(now) {
		if s.ID == id {
			return &s
		}
	}
	return nil
}

// claimEmail extracts the authenticated caller's email from the Cognito ID
// token claims that API Gateway's JWT authorizer forwards.
func claimEmail(req events.APIGatewayV2HTTPRequest) string {
	if req.RequestContext.Authorizer == nil || req.RequestContext.Authorizer.JWT == nil {
		return ""
	}
	return req.RequestContext.Authorizer.JWT.Claims["email"]
}

type handler struct {
	ddb   *dynamodb.Client
	eb    *eventbridge.Client
	table string
	bus   string
	log   *slog.Logger
}

func (h *handler) handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	path := req.RequestContext.HTTP.Path
	method := req.RequestContext.HTTP.Method
	switch {
	case method == "GET" && strings.HasSuffix(path, "/slots"):
		return httpx.JSON(200, map[string]any{"slots": slots(time.Now().UTC())})
	case method == "POST" && strings.HasSuffix(path, "/cancel"):
		return h.cancel(ctx, req)
	case method == "POST" && strings.HasSuffix(path, "/bookings"):
		return h.book(ctx, req)
	case method == "GET" && req.PathParameters["id"] != "":
		return h.get(ctx, req.PathParameters["id"])
	case method == "GET" && strings.HasSuffix(path, "/bookings"):
		return h.list(ctx, req)
	default:
		return httpx.Error(404, "not found")
	}
}

func (h *handler) book(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var in BookingRequest
	if err := json.Unmarshal([]byte(req.Body), &in); err != nil {
		return httpx.Error(400, "invalid JSON body")
	}
	if in.SlotID == "" || in.Email == "" {
		return httpx.Error(400, "slotId and email are required")
	}
	slot := findSlot(in.SlotID, time.Now().UTC())
	if slot == nil {
		return httpx.Error(404, "slot not found")
	}

	b := Booking{
		ID:       uuid.NewString(),
		SlotID:   slot.ID,
		Email:    in.Email,
		Name:     in.Name,
		Provider: slot.Provider,
		CRM:      slot.CRM,
		StartsAt: slot.StartsAt,
		Status:   "confirmed",
		IntakeID: in.IntakeID,
		Created:  time.Now().UTC().Format(time.RFC3339),
	}
	b.PK = "BOOKING#" + b.ID
	b.SK = "DETAIL"

	if err := h.putBooking(ctx, b); err != nil {
		h.log.Error("put booking", "error", err)
		return httpx.Error(500, "storage error")
	}
	// Per-email copy enables GET /bookings for the signed-in patient.
	emailCopy := b
	emailCopy.PK = "EMAIL#" + strings.ToLower(b.Email)
	emailCopy.SK = emailSK(b.StartsAt, b.ID)
	if err := h.putBooking(ctx, emailCopy); err != nil {
		h.log.Error("put booking email copy", "error", err)
		return httpx.Error(500, "storage error")
	}

	h.publish(ctx, "booking.confirmed", map[string]any{
		"bookingId": b.ID,
		"email":     b.Email,
		"provider":  b.Provider,
		"startsAt":  b.StartsAt,
	})

	h.log.Info("booking confirmed", "id", b.ID, "slot", b.SlotID)
	return httpx.JSON(201, b)
}

func (h *handler) putBooking(ctx context.Context, b Booking) error {
	item, err := attributevalue.MarshalMap(b)
	if err != nil {
		return err
	}
	_, err = h.ddb.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(h.table),
		Item:      item,
	})
	return err
}

func (h *handler) publish(ctx context.Context, detailType string, detail map[string]any) {
	payload, _ := json.Marshal(detail)
	if _, err := h.eb.PutEvents(ctx, &eventbridge.PutEventsInput{
		Entries: []ebtypes.PutEventsRequestEntry{{
			EventBusName: aws.String(h.bus),
			Source:       aws.String("levecare.scheduling"),
			DetailType:   aws.String(detailType),
			Detail:       aws.String(string(payload)),
		}},
	}); err != nil {
		h.log.Error("put event", "error", err, "detailType", detailType)
	}
}

func (h *handler) get(ctx context.Context, id string) (events.APIGatewayV2HTTPResponse, error) {
	b, err := h.fetch(ctx, id)
	if err != nil {
		h.log.Error("get booking", "error", err)
		return httpx.Error(500, "storage error")
	}
	if b == nil {
		return httpx.Error(404, "not found")
	}
	return httpx.JSON(200, b)
}

func (h *handler) fetch(ctx context.Context, id string) (*Booking, error) {
	out, err := h.ddb.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(h.table),
		Key: map[string]ddbtypes.AttributeValue{
			"pk": &ddbtypes.AttributeValueMemberS{Value: "BOOKING#" + id},
			"sk": &ddbtypes.AttributeValueMemberS{Value: "DETAIL"},
		},
	})
	if err != nil {
		return nil, err
	}
	if out.Item == nil {
		return nil, nil
	}
	var b Booking
	if err := attributevalue.UnmarshalMap(out.Item, &b); err != nil {
		return nil, err
	}
	return &b, nil
}

// list returns the authenticated caller's bookings, newest start time first.
func (h *handler) list(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	email := claimEmail(req)
	if email == "" {
		email = req.QueryStringParameters["email"]
	}
	if email == "" {
		return httpx.Error(400, "email claim missing")
	}

	out, err := h.ddb.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(h.table),
		KeyConditionExpression: aws.String("pk = :pk AND begins_with(sk, :sk)"),
		ExpressionAttributeValues: map[string]ddbtypes.AttributeValue{
			":pk": &ddbtypes.AttributeValueMemberS{Value: "EMAIL#" + strings.ToLower(email)},
			":sk": &ddbtypes.AttributeValueMemberS{Value: "BOOKING#"},
		},
	})
	if err != nil {
		h.log.Error("query bookings", "error", err)
		return httpx.Error(500, "storage error")
	}

	bookings := make([]Booking, 0, len(out.Items))
	for _, item := range out.Items {
		var b Booking
		if err := attributevalue.UnmarshalMap(item, &b); err != nil {
			continue
		}
		bookings = append(bookings, b)
	}
	sort.Slice(bookings, func(i, j int) bool { return bookings[i].StartsAt > bookings[j].StartsAt })
	return httpx.JSON(200, map[string]any{"bookings": bookings})
}

func (h *handler) cancel(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	id := req.PathParameters["id"]
	if id == "" {
		return httpx.Error(400, "booking id required")
	}
	b, err := h.fetch(ctx, id)
	if err != nil {
		h.log.Error("get booking for cancel", "error", err)
		return httpx.Error(500, "storage error")
	}
	if b == nil {
		return httpx.Error(404, "not found")
	}
	// Only the booking owner may cancel it.
	if email := claimEmail(req); email != "" && !strings.EqualFold(email, b.Email) {
		return httpx.Error(403, "not your booking")
	}
	if b.Status == "cancelled" {
		return httpx.JSON(200, b)
	}

	b.Status = "cancelled"
	b.PK = "BOOKING#" + b.ID
	b.SK = "DETAIL"
	if err := h.putBooking(ctx, *b); err != nil {
		h.log.Error("update booking", "error", err)
		return httpx.Error(500, "storage error")
	}
	emailCopy := *b
	emailCopy.PK = "EMAIL#" + strings.ToLower(b.Email)
	emailCopy.SK = emailSK(b.StartsAt, b.ID)
	if err := h.putBooking(ctx, emailCopy); err != nil {
		h.log.Error("update booking email copy", "error", err)
	}

	h.publish(ctx, "booking.cancelled", map[string]any{
		"bookingId": b.ID,
		"email":     b.Email,
		"provider":  b.Provider,
		"startsAt":  b.StartsAt,
	})

	h.log.Info("booking cancelled", "id", b.ID)
	return httpx.JSON(200, b)
}

func main() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(1)
	}
	h := &handler{
		ddb:   dynamodb.NewFromConfig(cfg),
		eb:    eventbridge.NewFromConfig(cfg),
		table: os.Getenv("TABLE_NAME"),
		bus:   os.Getenv("EVENT_BUS_NAME"),
		log:   slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "scheduling"),
	}
	lambda.Start(h.handle)
}
