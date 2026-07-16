package main

import (
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
)

func TestSlotsSkipWeekendsAndAreDeterministic(t *testing.T) {
	now := time.Date(2026, 7, 16, 12, 0, 0, 0, time.UTC) // Thursday
	first := slots(now)
	second := slots(now)

	if len(first) == 0 {
		t.Fatal("expected slots to be generated")
	}
	if len(first) != len(second) {
		t.Fatalf("expected deterministic slot count, got %d then %d", len(first), len(second))
	}
	for i, s := range first {
		if s.ID != second[i].ID {
			t.Fatalf("slot IDs must be stable: %s != %s", s.ID, second[i].ID)
		}
		start, err := time.Parse(time.RFC3339, s.StartsAt)
		if err != nil {
			t.Fatalf("bad startsAt %q: %v", s.StartsAt, err)
		}
		if wd := start.Weekday(); wd == time.Saturday || wd == time.Sunday {
			t.Fatalf("slot %s falls on a weekend", s.ID)
		}
		if s.CRM == "" {
			t.Fatalf("slot %s missing CRM", s.ID)
		}
	}
}

func TestFindSlot(t *testing.T) {
	now := time.Date(2026, 7, 16, 12, 0, 0, 0, time.UTC)
	all := slots(now)
	if got := findSlot(all[0].ID, now); got == nil || got.ID != all[0].ID {
		t.Fatalf("expected to find slot %s", all[0].ID)
	}
	if got := findSlot("slot-nope", now); got != nil {
		t.Fatalf("expected nil for unknown slot, got %+v", got)
	}
}

func TestEmailSK(t *testing.T) {
	got := emailSK("2026-07-20T09:00:00Z", "abc")
	want := "BOOKING#2026-07-20T09:00:00Z#abc"
	if got != want {
		t.Fatalf("emailSK = %q, want %q", got, want)
	}
}

func TestClaimEmail(t *testing.T) {
	req := events.APIGatewayV2HTTPRequest{
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
				JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
					Claims: map[string]string{"email": "user@example.com"},
				},
			},
		},
	}
	if got := claimEmail(req); got != "user@example.com" {
		t.Fatalf("claimEmail = %q", got)
	}
	if got := claimEmail(events.APIGatewayV2HTTPRequest{}); got != "" {
		t.Fatalf("expected empty claim, got %q", got)
	}
}
