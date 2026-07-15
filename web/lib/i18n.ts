export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

export const dictionaries = {
  pt: {
    nav: { intake: "Avaliação", booking: "Agenda", dashboard: "Painel" },
    hero: {
      badge: "Projeto de demonstração — não é um serviço médico real",
      eyebrow: "Médico-guiado",
      title: "Cuidado médico para emagrecer, redesenhado para o Brasil",
      subtitle:
        "Acompanhamento guiado por médicos, avaliação online e prescrição digital — simples, direto e acessível.",
      cta: "Começar avaliação gratuita",
      secondary: "Ver como funciona",
    },
    features: {
      title: "Cuidado completo, sem complicação",
      items: [
        {
          title: "Avaliação de elegibilidade",
          text: "Questionário clínico online com resultado imediato.",
          icon: "assignment",
        },
        {
          title: "Médicos com CRM ativo",
          text: "Consultas por vídeo com especialistas verificados.",
          icon: "medical_services",
        },
        {
          title: "Prescrição digital",
          text: "Receita nata digital com assinatura ICP-Brasil e registro SNCR (simulado nesta demo).",
          icon: "description",
        },
        {
          title: "Acompanhamento contínuo",
          text: "Ajuste de dose e suporte pelo canal que você já usa.",
          icon: "monitoring",
        },
      ],
    },
    plans: {
      title: "Planos transparentes",
      subtitle: "Escolha a modalidade de cuidado ideal para o seu objetivo. Sem fidelidade.",
      recommended: "Recomendado",
      ctaSingle: "Agendar agora",
      ctaCare: "Começar com Cuidado",
      ctaComplete: "Ver Completo",
      items: [
        {
          name: "Avulso",
          price: "R$89",
          period: "por consulta",
          features: ["Consulta por vídeo", "Receita digital", "Sem mensalidade"],
        },
        {
          name: "Plano Cuidado",
          price: "R$149",
          period: "/mês",
          features: ["Consultas trimestrais", "Time de cuidado", "Plano nutricional", "Gestão de prescrição"],
          highlight: true,
        },
        {
          name: "Plano Completo",
          price: "R$299",
          period: "/mês",
          features: ["Tudo do Cuidado", "Consultas mensais", "Logística de medicação", "Suporte prioritário"],
        },
      ],
    },
    intake: {
      title: "Avaliação de elegibilidade",
      subtitle: "Baseada em critérios clínicos para tratamento com GLP-1 (demonstração).",
      personal: "Informações pessoais",
      clinical: "Perfil clínico",
      email: "E-mail",
      age: "Idade",
      height: "Altura (cm)",
      weight: "Peso (kg)",
      comorbidities: "Comorbidades (selecione se aplicável)",
      comorbidityOptions: {
        "diabetes-2": "Diabetes tipo 2",
        hipertensao: "Hipertensão",
        apneia: "Apneia do sono",
        dislipidemia: "Dislipidemia",
      },
      pregnant: "Gestante ou amamentando",
      eatingDisorder: "Histórico de transtorno alimentar",
      submit: "Ver meu resultado",
      lgpdNote: "Seus dados são tratados conforme LGPD nesta demonstração.",
      eligible: "Você é elegível para avaliação médica",
      eligibleText:
        "Com base nas suas respostas, você atende aos critérios iniciais. O próximo passo seria agendar uma consulta.",
      notEligible: "No momento, você não atende aos critérios",
      notEligibleText:
        "Isso não é um diagnóstico. Procure orientação médica presencial para entender suas opções.",
      bmi: "IMC calculado",
      bmiLabel: "Seu IMC calculado",
      classification: "Classificação",
      goalTitle: "Próximo passo",
      goalText: "Agende uma consulta com a rede médica fictícia desta demonstração.",
      approachTitle: "Abordagem",
      approachText: "Avaliação médica, plano de cuidado e gestão de prescrição (simulada).",
      next: "Agendar consulta",
      error: "Não foi possível enviar sua avaliação. Tente novamente.",
    },
    booking: {
      title: "Agende sua consulta",
      subtitle: "Horários de demonstração com a rede médica fictícia.",
      sectionProviders: "Especialistas disponíveis",
      sectionSchedule: "Data e horário",
      name: "Nome completo",
      email: "E-mail",
      pick: "Escolha um horário",
      submit: "Confirmar agendamento",
      cancel: "Cancelar",
      confirmed: "Consulta confirmada!",
      confirmedText:
        "Você receberá um e-mail de confirmação (nesta demo, o e-mail vai para a caixa verificada no SES).",
      authRequired:
        "É necessário entrar ou criar uma conta no Painel (Cognito) para confirmar o agendamento.",
      noSlots: "Nenhum horário disponível no momento.",
      error: "Não foi possível agendar. Tente novamente.",
    },
    dashboard: {
      title: "Painel do paciente",
      subtitle: "Acesso ao painel clínico",
      demoNote:
        "Área autenticada de demonstração: crie um registro de paciente, capture consentimento LGPD e emita uma prescrição fictícia.",
      createPatient: "Criar registro de paciente",
      name: "Nome",
      email: "E-mail",
      consentTitle: "Consentimento LGPD",
      consentPurpose: "Tratamento de dados de saúde para acompanhamento clínico",
      consentHint: "Conceder consentimento para tratamento de dados de saúde",
      grant: "Conceder consentimento",
      revoke: "Revogar",
      prescriptionTitle: "Prescrição demonstrativa",
      prescriptionHint:
        "Gera um PDF de demonstração com marca d'água. Não possui validade clínica nem assinatura ICP-Brasil real.",
      issue: "Emitir receita demonstração",
      download: "Baixar PDF",
      requiresConsent: "Requer consentimento LGPD ativo.",
      demoWatermark: "DEMONSTRAÇÃO",
      patientIdentified: "Paciente identificado",
      signIn: "Entrar",
      signUp: "Criar conta",
      signOut: "Sair",
      password: "Senha",
      confirmCode: "Código de confirmação",
      confirm: "Confirmar",
      authNote: "Autenticação real via Amazon Cognito.",
      authCta: "Entrar no sistema",
      newAccount: "Novo por aqui? Crie sua conta de paciente.",
    },
    footer: {
      terms: "Termos de Uso",
      privacy: "Privacidade",
      support: "Suporte",
      compliance: "© 2026 LeveCare (demo). Conformidade CFM, ICP-Brasil & LGPD — estudo de portfólio.",
      disclaimer:
        "LeveCare é um projeto de portfólio. Telas, planos, médicos e prescrições são fictícios. Nada aqui constitui aconselhamento médico. Requisitos reais: CFM 2.314/2022, ICP-Brasil, ANVISA RDC 1.000/2025 (SNCR) e LGPD.",
      built: "Construído com Java, Go, Next.js e AWS serverless por",
    },
  },
  en: {
    nav: { intake: "Assessment", booking: "Booking", dashboard: "Dashboard" },
    hero: {
      badge: "Demonstration project — not a real medical service",
      eyebrow: "Doctor-guided",
      title: "Doctor-guided weight care, redesigned for Brazil",
      subtitle:
        "Physician-led follow-up, online assessment, and digital prescriptions — simple, direct, and affordable.",
      cta: "Start free assessment",
      secondary: "See how it works",
    },
    features: {
      title: "Complete care, without friction",
      items: [
        {
          title: "Eligibility assessment",
          text: "Online clinical questionnaire with instant results.",
          icon: "assignment",
        },
        {
          title: "Licensed physicians",
          text: "Video consultations with CRM-verified specialists.",
          icon: "medical_services",
        },
        {
          title: "Digital prescription",
          text: "Natively digital prescription with ICP-Brasil signature and SNCR registration (simulated in this demo).",
          icon: "description",
        },
        {
          title: "Continuous care",
          text: "Dose adjustments and support on the channel you already use.",
          icon: "monitoring",
        },
      ],
    },
    plans: {
      title: "Transparent plans",
      subtitle: "Pick the care modality that fits your goals. No lock-in.",
      recommended: "Recommended",
      ctaSingle: "Book now",
      ctaCare: "Start with Care",
      ctaComplete: "See Complete",
      items: [
        {
          name: "Single visit",
          price: "R$89",
          period: "per consult",
          features: ["Video consultation", "Digital prescription", "No subscription"],
        },
        {
          name: "Care Plan",
          price: "R$149",
          period: "/mo",
          features: ["Quarterly consults", "Care team", "Nutrition plan", "Prescription management"],
          highlight: true,
        },
        {
          name: "Complete Plan",
          price: "R$299",
          period: "/mo",
          features: ["Everything in Care", "Monthly consults", "Medication logistics", "Priority support"],
        },
      ],
    },
    intake: {
      title: "Eligibility assessment",
      subtitle: "Based on clinical criteria for GLP-1 treatment (demonstration).",
      personal: "Personal information",
      clinical: "Clinical profile",
      email: "Email",
      age: "Age",
      height: "Height (cm)",
      weight: "Weight (kg)",
      comorbidities: "Comorbidities (select if applicable)",
      comorbidityOptions: {
        "diabetes-2": "Type 2 diabetes",
        hipertensao: "Hypertension",
        apneia: "Sleep apnea",
        dislipidemia: "Dyslipidemia",
      },
      pregnant: "Pregnant or breastfeeding",
      eatingDisorder: "History of eating disorder",
      submit: "See my result",
      lgpdNote: "Your data is processed under LGPD in this demonstration.",
      eligible: "You are eligible for medical evaluation",
      eligibleText:
        "Based on your answers, you meet the initial criteria. The next step would be booking a consultation.",
      notEligible: "You do not currently meet the criteria",
      notEligibleText:
        "This is not a diagnosis. Seek in-person medical guidance to understand your options.",
      bmi: "Calculated BMI",
      bmiLabel: "Your calculated BMI",
      classification: "Classification",
      goalTitle: "Next step",
      goalText: "Book a consultation with this demo’s fictitious medical network.",
      approachTitle: "Approach",
      approachText: "Medical evaluation, care plan, and prescription management (simulated).",
      next: "Book consultation",
      error: "Could not submit your assessment. Please try again.",
    },
    booking: {
      title: "Book your consultation",
      subtitle: "Demo slots with the fictitious medical network.",
      sectionProviders: "Available specialists",
      sectionSchedule: "Date and time",
      name: "Full name",
      email: "Email",
      pick: "Pick a time",
      submit: "Confirm booking",
      cancel: "Cancel",
      confirmed: "Consultation confirmed!",
      confirmedText:
        "You will receive a confirmation email (in this demo, mail goes to the SES-verified inbox).",
      authRequired: "Sign in or create an account in the Dashboard (Cognito) to confirm the booking.",
      noSlots: "No slots available right now.",
      error: "Could not book. Please try again.",
    },
    dashboard: {
      title: "Patient dashboard",
      subtitle: "Access the clinical panel",
      demoNote:
        "Authenticated demo area: create a patient record, capture LGPD consent, and issue a mock prescription.",
      createPatient: "Create patient record",
      name: "Name",
      email: "Email",
      consentTitle: "LGPD consent",
      consentPurpose: "Health data processing for clinical follow-up",
      consentHint: "Grant consent for health data processing",
      grant: "Grant consent",
      revoke: "Revoke",
      prescriptionTitle: "Demonstration prescription",
      prescriptionHint:
        "Generates a watermarked demonstration PDF. It has no clinical validity and no real ICP-Brasil signature.",
      issue: "Issue demo prescription",
      download: "Download PDF",
      requiresConsent: "Requires active LGPD consent.",
      demoWatermark: "DEMONSTRATION",
      patientIdentified: "Patient identified",
      signIn: "Sign in",
      signUp: "Sign up",
      signOut: "Sign out",
      password: "Password",
      confirmCode: "Confirmation code",
      confirm: "Confirm",
      authNote: "Real authentication via Amazon Cognito.",
      authCta: "Sign in to the system",
      newAccount: "New here? Create your patient account.",
    },
    footer: {
      terms: "Terms of Use",
      privacy: "Privacy",
      support: "Support",
      compliance: "© 2026 LeveCare (demo). CFM, ICP-Brasil & LGPD compliance — portfolio study.",
      disclaimer:
        "LeveCare is a portfolio project. Screens, plans, physicians, and prescriptions are fictitious. Nothing here is medical advice. Real-world requirements: CFM 2.314/2022, ICP-Brasil, ANVISA RDC 1.000/2025 (SNCR), and LGPD.",
      built: "Built with Java, Go, Next.js, and AWS serverless by",
    },
  },
};

export type Dictionary = (typeof dictionaries)["pt"];

export function getDictionary(locale: string): Dictionary {
  return (dictionaries as unknown as Record<string, Dictionary>)[locale] ?? dictionaries.pt;
}

/** Demo-only BMI band label for result UI. */
export function bmiClassification(bmi: number, locale: Locale): string {
  const pt = locale === "pt";
  if (bmi < 18.5) return pt ? "Baixo peso" : "Underweight";
  if (bmi < 25) return pt ? "Eutrofia" : "Normal";
  if (bmi < 30) return pt ? "Sobrepeso" : "Overweight";
  if (bmi < 35) return pt ? "Obesidade grau I" : "Obesity class I";
  if (bmi < 40) return pt ? "Obesidade grau II" : "Obesity class II";
  return pt ? "Obesidade grau III" : "Obesity class III";
}
