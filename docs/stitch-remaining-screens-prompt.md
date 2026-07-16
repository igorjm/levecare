# Stitch prompt — LeveCare remaining screens

Follow-up to [stitch-design-system-prompt.md](stitch-design-system-prompt.md). The base system already exists in Stitch project `12274219274134275234` (**Serene Clinical** design system: Inter + Source Serif 4, sage/forest green primary, warm off-white surfaces, 12/16px radii, soft shadows, amber demo-disclaimer chips). These new screens close the end-to-end patient journey that is now implemented in code: journey prefill, inline auth in the booking flow, and a real patient dashboard with consultations and prescription history.

Ask Stitch to **extend the existing project** so every token, component, and spacing rhythm is reused — do not restyle.

---

## Prompt (paste into Stitch, same project)

```
Extend the existing LeveCare design system (Serene Clinical) with the remaining product screens. Reuse the established tokens exactly: typography (Source Serif 4 display, Inter body), the sage/forest green primary palette, warm off-white surfaces, 12px control / 16px card radii, hairline borders, soft shadows, and the amber "demonstração" disclaimer chip pattern. PT-BR copy first; every product screen keeps a subtle demo disclaimer.

These screens complete the patient journey that already exists: Landing → Avaliação → Agenda (with inline sign-in) → Painel do paciente (profile, consent, consultations, prescriptions). Design mobile + desktop for each.

────────────────────────────────────────
1) PAINEL DO PACIENTE v2 — journey dashboard (/painel)
────────────────────────────────────────
The signed-in home. Patient-centric overview, calm clinical tone, one column on mobile / comfortable two-column rhythm on desktop:
- Patient chip row: pill with status dot + "Paciente identificado: {nome} · {email}", sign-out link on the right.
- "Sua avaliação" card: calculated BMI (e.g. 31.2 kg/m²), eligibility badge ("Elegível para avaliação médica"), quiet "Refazer avaliação" link.
- "Consentimento LGPD" card: status chip (Consentimento ativo — green dot / Consentimento não concedido — neutral), purpose line ("Tratamento de dados de saúde para acompanhamento clínico"), actions Conceder consentimento (primary) / Revogar (danger-outline). Revogar disabled unless active.
- "Minhas consultas" card: list of upcoming/past bookings (see screen 2 states) + "Agendar consulta" link.
- "Minhas prescrições" card: prescription history list (see screen 3) + issue button gated on consent, with the watermarked document preview placeholder already used in the system.

────────────────────────────────────────
2) MINHAS CONSULTAS — list states
────────────────────────────────────────
Inside the Painel card (and as a focused mobile view). Each row: provider name + CRM, date/time (e.g. "seg., 20 jul, 09:00"), status chip, action.
- Upcoming/confirmed: green-tinted "Confirmada" chip + "Cancelar consulta" danger-outline button.
- Cancel confirmation: inline dialog/sheet — "Cancelar esta consulta?" with consequences copy ("Você receberá um e-mail de confirmação do cancelamento.") and Manter / Cancelar consulta actions.
- Cancelled: muted row, strikethrough "Cancelada" chip, no action.
- Empty: friendly empty state with calendar icon, "Nenhuma consulta agendada." + primary "Agendar consulta".

────────────────────────────────────────
3) MINHAS PRESCRIÇÕES — history
────────────────────────────────────────
List of issued demo prescriptions, newest first. Each row: document icon, "Emitida em {data hora}", amber DEMONSTRAÇÃO watermark tag, "Baixar PDF novamente" text button.
- Empty state: "Nenhuma prescrição emitida ainda." with muted document illustration.
- Issue action: primary button "Emitir receita demonstração", disabled state with helper "Requer consentimento LGPD ativo."
- Never present the document as clinically valid: keep the watermark treatment and ICP-Brasil/SNCR placeholder language.

────────────────────────────────────────
4) AUTH CARD — variants (shared component)
────────────────────────────────────────
One centered card component (max-width ~28rem) with the LeveCare wordmark, used standalone in /painel and embedded in /agenda. Patient-facing labels, Cognito-backed. Variants:
- Entrar: email + senha, primary "Entrar", secondary "Criar conta", "Esqueceu a senha?" text link, "Autenticação real via Amazon Cognito" trust chip.
- Criar conta → Confirmar código: single code field, "Enviamos um código para o seu e-mail." notice, "Confirmar" button.
- Esqueceu a senha: email field + "Enviar código", "Voltar para o login" link.
- Redefinir senha: code + nova senha fields, "Redefinir senha" button, success notice "Senha redefinida! Entre com a nova senha."

────────────────────────────────────────
5) AGENDA — signed-out state (/agenda)
────────────────────────────────────────
The slot picker (providers with CRM, day chips, time grid) stays fully visible and interactive; the user's selection is preserved. Below the picker:
- Info strip: "Entre ou crie sua conta para confirmar o agendamento. Sua seleção de horário será mantida."
- The embedded auth card (screen 4) inline — not a redirect, not a modal takeover.
- Confirm button visible but disabled until signed in.
Also design the post-booking confirmation card with a "Ver minhas consultas no Painel" link.

────────────────────────────────────────
6) TRANSACTIONAL EMAILS (PT-BR)
────────────────────────────────────────
Three minimal, text-forward email templates consistent with the brand (simple header wordmark, generous whitespace, footer disclaimer "Demonstração — LeveCare não é um serviço médico real."):
- Consulta confirmada: provider + date/time summary.
- Consulta cancelada: cancelled slot summary + "agende um novo horário" CTA.
- Prescrição de demonstração emitida: explicit no-clinical-validity warning, no attachment implied.

────────────────────────────────────────
7) EMPTY / ERROR / LOADING STATES SHEET
────────────────────────────────────────
A reference sheet of shared states using the system tokens:
- Loading: centered quiet text ("Carregando seus dados…") + skeleton rows for lists.
- Empty: icon + one sentence + one action (pattern used by consultas/prescrições).
- Error: inline error text in the error color under the affected control; a full-card variant for failed loads with "Tentar novamente".
- Offline/API-down banner variant.

Constraints (unchanged from the base project): no payments, no video-consult room, no WhatsApp chat UI, no real prescription validity. Demo disclaimers stay visible but calm (amber chip, never alarming red).
```

---

## Mapping to implemented code (for review after design import)

| Stitch screen | Implemented in |
| --- | --- |
| Painel v2 | `web/app/[locale]/painel/Dashboard.tsx` |
| Minhas consultas | `Dashboard.tsx` + `GET /bookings`, `POST /bookings/{id}/cancel` |
| Minhas prescrições | `Dashboard.tsx` + `GET /patients/{id}/prescriptions[/{rxId}]` |
| Auth card variants | `web/components/AuthCard.tsx` (Amplify signIn/signUp/reset) |
| Agenda signed-out | `web/app/[locale]/agenda/BookingFlow.tsx` (inline AuthCard) |
| Emails | `services/go/notification/main.go` render() |
