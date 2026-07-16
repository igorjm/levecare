// notification-service: consumes domain events from SQS (fed by EventBridge)
// and sends transactional email via SES. In the SES sandbox both sender and
// recipient must be verified, so all demo mail goes to NOTIFY_EMAIL.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	sestypes "github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

// envelope is the EventBridge event as delivered inside the SQS message body.
type envelope struct {
	Source     string          `json:"source"`
	DetailType string          `json:"detail-type"`
	Detail     json.RawMessage `json:"detail"`
}

type handler struct {
	ses   *sesv2.Client
	email string
	log   *slog.Logger
}

func (h *handler) render(env envelope) (subject, body string) {
	var d map[string]any
	_ = json.Unmarshal(env.Detail, &d)

	switch env.DetailType {
	case "booking.confirmed":
		return "LeveCare — consulta confirmada",
			fmt.Sprintf("Sua consulta com %v está confirmada para %v.\n\n(Demonstração — LeveCare não é um serviço médico real.)",
				d["provider"], d["startsAt"])
	case "booking.cancelled":
		return "LeveCare — consulta cancelada",
			fmt.Sprintf("Sua consulta com %v marcada para %v foi cancelada. Você pode agendar um novo horário quando quiser.\n\n(Demonstração — LeveCare não é um serviço médico real.)",
				d["provider"], d["startsAt"])
	case "intake.completed":
		status := "não elegível no momento"
		if eligible, _ := d["eligible"].(bool); eligible {
			status = "elegível para avaliação médica"
		}
		return "LeveCare — resultado da sua avaliação",
			fmt.Sprintf("Sua avaliação inicial foi concluída: %s.\n\n(Demonstração — LeveCare não é um serviço médico real.)", status)
	case "prescription.issued":
		return "LeveCare — prescrição de demonstração emitida",
			"Uma prescrição de DEMONSTRAÇÃO foi gerada. Este documento não tem validade médica.\n\n(Demonstração — LeveCare não é um serviço médico real.)"
	default:
		return "LeveCare — atualização", fmt.Sprintf("Evento: %s\n\n(Demonstração.)", env.DetailType)
	}
}

func (h *handler) handle(ctx context.Context, ev events.SQSEvent) (events.SQSEventResponse, error) {
	var failures []events.SQSBatchItemFailure
	for _, record := range ev.Records {
		var env envelope
		if err := json.Unmarshal([]byte(record.Body), &env); err != nil {
			h.log.Error("bad envelope", "error", err, "messageId", record.MessageId)
			continue // malformed message: drop rather than retry forever
		}
		subject, body := h.render(env)
		_, err := h.ses.SendEmail(ctx, &sesv2.SendEmailInput{
			FromEmailAddress: aws.String(h.email),
			Destination:      &sestypes.Destination{ToAddresses: []string{h.email}},
			Content: &sestypes.EmailContent{
				Simple: &sestypes.Message{
					Subject: &sestypes.Content{Data: aws.String(subject)},
					Body: &sestypes.Body{
						Text: &sestypes.Content{Data: aws.String(body)},
					},
				},
			},
		})
		if err != nil {
			h.log.Error("send email", "error", err, "detailType", env.DetailType)
			failures = append(failures, events.SQSBatchItemFailure{ItemIdentifier: record.MessageId})
			continue
		}
		h.log.Info("email sent", "detailType", env.DetailType)
	}
	return events.SQSEventResponse{BatchItemFailures: failures}, nil
}

func main() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(1)
	}
	h := &handler{
		ses:   sesv2.NewFromConfig(cfg),
		email: os.Getenv("NOTIFY_EMAIL"),
		log:   slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "notification"),
	}
	lambda.Start(h.handle)
}
