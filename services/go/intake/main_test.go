package main

import "testing"

func TestScore(t *testing.T) {
	cases := []struct {
		name     string
		req      IntakeRequest
		eligible bool
		reason   string
	}{
		{
			name:     "obese adult is eligible",
			req:      IntakeRequest{Age: 35, HeightCm: 170, WeightKg: 95},
			eligible: true,
			reason:   "imc-elegivel",
		},
		{
			name:     "overweight with comorbidity is eligible",
			req:      IntakeRequest{Age: 42, HeightCm: 170, WeightKg: 80, Comorbidities: []string{"diabetes-2"}},
			eligible: true,
			reason:   "imc-com-comorbidade",
		},
		{
			name:     "overweight without comorbidity is not eligible",
			req:      IntakeRequest{Age: 42, HeightCm: 170, WeightKg: 80},
			eligible: false,
			reason:   "imc-abaixo-do-criterio",
		},
		{
			name:     "minor is excluded regardless of BMI",
			req:      IntakeRequest{Age: 16, HeightCm: 170, WeightKg: 110},
			eligible: false,
			reason:   "menor-de-idade",
		},
		{
			name:     "pregnancy is a hard exclusion",
			req:      IntakeRequest{Age: 30, HeightCm: 165, WeightKg: 100, Pregnant: true},
			eligible: false,
			reason:   "gestacao",
		},
		{
			name:     "eating disorder history is a hard exclusion",
			req:      IntakeRequest{Age: 30, HeightCm: 165, WeightKg: 100, EatingDisorderHistory: true},
			eligible: false,
			reason:   "historico-transtorno-alimentar",
		},
		{
			name:     "invalid measurements are rejected",
			req:      IntakeRequest{Age: 30, HeightCm: 0, WeightKg: 100},
			eligible: false,
			reason:   "dados-invalidos",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			bmi, eligible, reasons := score(tc.req)
			if eligible != tc.eligible {
				t.Fatalf("eligible = %v, want %v (bmi %.1f)", eligible, tc.eligible, bmi)
			}
			if len(reasons) == 0 || reasons[0] != tc.reason {
				t.Fatalf("reasons = %v, want first %q", reasons, tc.reason)
			}
		})
	}
}

func TestScoreBMICalculation(t *testing.T) {
	bmi, _, _ := score(IntakeRequest{Age: 30, HeightCm: 180, WeightKg: 81})
	if bmi < 24.9 || bmi > 25.1 {
		t.Fatalf("bmi = %.2f, want ~25.0", bmi)
	}
}
