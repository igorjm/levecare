// intake-service: public eligibility questionnaire scoring.
//
// POST /intake      — scores the questionnaire, persists the result, emits intake.completed
// GET  /intake/{id} — returns a previously scored intake
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
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

type IntakeRequest struct {
	Email                 string   `json:"email"`
	Age                   int      `json:"age"`
	HeightCm              float64  `json:"heightCm"`
	WeightKg              float64  `json:"weightKg"`
	Comorbidities         []string `json:"comorbidities"` // e.g. diabetes-2, hipertensao, apneia, dislipidemia
	Pregnant              bool     `json:"pregnant"`
	EatingDisorderHistory bool     `json:"eatingDisorderHistory"`
}

type IntakeResult struct {
	PK       string   `dynamodbav:"pk" json:"-"`
	SK       string   `dynamodbav:"sk" json:"-"`
	ID       string   `dynamodbav:"id" json:"id"`
	Email    string   `dynamodbav:"email" json:"email"`
	BMI      float64  `dynamodbav:"bmi" json:"bmi"`
	Eligible bool     `dynamodbav:"eligible" json:"eligible"`
	Reasons  []string `dynamodbav:"reasons" json:"reasons"`
	Created  string   `dynamodbav:"createdAt" json:"createdAt"`
}

// score applies demo eligibility rules loosely modeled on GLP-1 prescribing
// criteria (BMI >= 30, or BMI >= 27 with a weight-related comorbidity), with
// hard exclusions. A real product would use a clinically validated protocol.
func score(req IntakeRequest) (bmi float64, eligible bool, reasons []string) {
	if req.HeightCm <= 0 || req.WeightKg <= 0 {
		return 0, false, []string{"dados-invalidos"}
	}
	h := req.HeightCm / 100
	bmi = req.WeightKg / (h * h)

	switch {
	case req.Age < 18:
		reasons = append(reasons, "menor-de-idade")
	case req.Pregnant:
		reasons = append(reasons, "gestacao")
	case req.EatingDisorderHistory:
		reasons = append(reasons, "historico-transtorno-alimentar")
	}
	if len(reasons) > 0 {
		return bmi, false, reasons
	}

	switch {
	case bmi >= 30:
		return bmi, true, []string{"imc-elegivel"}
	case bmi >= 27 && len(req.Comorbidities) > 0:
		return bmi, true, []string{"imc-com-comorbidade"}
	default:
		return bmi, false, []string{"imc-abaixo-do-criterio"}
	}
}

type handler struct {
	ddb   *dynamodb.Client
	eb    *eventbridge.Client
	table string
	bus   string
	log   *slog.Logger
}

func (h *handler) handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch req.RequestContext.HTTP.Method {
	case "POST":
		return h.create(ctx, req)
	case "GET":
		return h.get(ctx, req)
	default:
		return httpx.Error(405, "method not allowed")
	}
}

func (h *handler) create(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var in IntakeRequest
	if err := json.Unmarshal([]byte(req.Body), &in); err != nil {
		return httpx.Error(400, "invalid JSON body")
	}
	if in.Email == "" {
		return httpx.Error(400, "email is required")
	}

	bmi, eligible, reasons := score(in)
	result := IntakeResult{
		ID:       uuid.NewString(),
		Email:    in.Email,
		BMI:      float64(int(bmi*10)) / 10,
		Eligible: eligible,
		Reasons:  reasons,
		Created:  time.Now().UTC().Format(time.RFC3339),
	}
	result.PK = "INTAKE#" + result.ID
	result.SK = "RESULT"

	item, err := attributevalue.MarshalMap(result)
	if err != nil {
		return httpx.Error(500, "marshal error")
	}
	if _, err := h.ddb.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(h.table),
		Item:      item,
	}); err != nil {
		h.log.Error("put intake", "error", err)
		return httpx.Error(500, "storage error")
	}

	detail, _ := json.Marshal(map[string]any{
		"intakeId": result.ID,
		"email":    result.Email,
		"eligible": result.Eligible,
	})
	if _, err := h.eb.PutEvents(ctx, &eventbridge.PutEventsInput{
		Entries: []ebtypes.PutEventsRequestEntry{{
			EventBusName: aws.String(h.bus),
			Source:       aws.String("levecare.intake"),
			DetailType:   aws.String("intake.completed"),
			Detail:       aws.String(string(detail)),
		}},
	}); err != nil {
		// Notification is best-effort; the intake result is already stored.
		h.log.Error("put event", "error", err)
	}

	h.log.Info("intake scored", "id", result.ID, "eligible", result.Eligible, "bmi", result.BMI)
	return httpx.JSON(201, result)
}

func (h *handler) get(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	id := req.PathParameters["id"]
	if id == "" {
		return httpx.Error(400, "missing id")
	}
	out, err := h.ddb.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(h.table),
		Key: map[string]ddbtypes.AttributeValue{
			"pk": &ddbtypes.AttributeValueMemberS{Value: "INTAKE#" + id},
			"sk": &ddbtypes.AttributeValueMemberS{Value: "RESULT"},
		},
	})
	if err != nil {
		h.log.Error("get intake", "error", err)
		return httpx.Error(500, "storage error")
	}
	if out.Item == nil {
		return httpx.Error(404, "not found")
	}
	var result IntakeResult
	if err := attributevalue.UnmarshalMap(out.Item, &result); err != nil {
		return httpx.Error(500, "unmarshal error")
	}
	return httpx.JSON(200, result)
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
		log:   slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "intake"),
	}
	lambda.Start(h.handle)
}
