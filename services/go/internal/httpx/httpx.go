// Package httpx contains small helpers for API Gateway HTTP API (payload v2) handlers.
package httpx

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func JSON(status int, body any) (events.APIGatewayV2HTTPResponse, error) {
	b, err := json.Marshal(body)
	if err != nil {
		return events.APIGatewayV2HTTPResponse{StatusCode: 500}, nil
	}
	return events.APIGatewayV2HTTPResponse{
		StatusCode: status,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		Body: string(b),
	}, nil
}

func Error(status int, message string) (events.APIGatewayV2HTTPResponse, error) {
	return JSON(status, map[string]string{"error": message})
}
