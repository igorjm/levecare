// scheduling-service: mock provider slots and consultation bookings.
//
// GET  /slots         — next 7 days of demo provider slots (public)
// POST /bookings      — books a slot, emits booking.confirmed (JWT)
// GET  /bookings/{id} — booking detail (JWT)
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
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
	SlotID string `json:"slotId"`
	Email  string `json:"email"`
	Name   string `json:"name"`
}

type Booking struct {
	PK       string `dynamodbav:"pk" json:"-"`
	SK       string `dynamodbav:"sk" json:"-"`
	ID       string `dynamodbav:"id" json:"id"`
	SlotID   string `dynamodbav:"slotId" json:"slotId"`
	Email    string `dynamodbav:"email" json:"email"`
	Name     string `dynamodbav:"name" json:"name"`
	Provider string `dynamodbav:"provider" json:"provider"`
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`
	Status   string `dynamodbav:"status" json:"status"`
	Created  string `dynamodbav:"createdAt" json:"createdAt"`
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
	case method == "POST" && strings.HasSuffix(path, "/bookings"):
		return h.book(ctx, req)
	case method == "GET" && req.PathParameters["id"] != "":
		return h.get(ctx, req.PathParameters["id"])
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
		StartsAt: slot.StartsAt,
		Status:   "confirmed",
		Created:  time.Now().UTC().Format(time.RFC3339),
	}
	b.PK = "BOOKING#" + b.ID
	b.SK = "DETAIL"

	item, err := attributevalue.MarshalMap(b)
	if err != nil {
		return httpx.Error(500, "marshal error")
	}
	if _, err := h.ddb.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(h.table),
		Item:      item,
	}); err != nil {
		h.log.Error("put booking", "error", err)
		return httpx.Error(500, "storage error")
	}

	detail, _ := json.Marshal(map[string]any{
		"bookingId": b.ID,
		"email":     b.Email,
		"provider":  b.Provider,
		"startsAt":  b.StartsAt,
	})
	if _, err := h.eb.PutEvents(ctx, &eventbridge.PutEventsInput{
		Entries: []ebtypes.PutEventsRequestEntry{{
			EventBusName: aws.String(h.bus),
			Source:       aws.String("levecare.scheduling"),
			DetailType:   aws.String("booking.confirmed"),
			Detail:       aws.String(string(detail)),
		}},
	}); err != nil {
		h.log.Error("put event", "error", err)
	}

	h.log.Info("booking confirmed", "id", b.ID, "slot", b.SlotID)
	return httpx.JSON(201, b)
}

func (h *handler) get(ctx context.Context, id string) (events.APIGatewayV2HTTPResponse, error) {
	out, err := h.ddb.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(h.table),
		Key: map[string]ddbtypes.AttributeValue{
			"pk": &ddbtypes.AttributeValueMemberS{Value: "BOOKING#" + id},
			"sk": &ddbtypes.AttributeValueMemberS{Value: "DETAIL"},
		},
	})
	if err != nil {
		h.log.Error("get booking", "error", err)
		return httpx.Error(500, "storage error")
	}
	if out.Item == nil {
		return httpx.Error(404, "not found")
	}
	var b Booking
	if err := attributevalue.UnmarshalMap(out.Item, &b); err != nil {
		return httpx.Error(500, "unmarshal error")
	}
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
