# Stitch prompt — LeveCare full system layout

Copy everything below the line into [Stitch](https://stitch.withgoogle.com/) (or refine screen-by-screen). Ask Stitch for a **complete multi-screen UI system**, not a single marketing hero.

---

## Prompt (paste into Stitch)

```
You are designing a complete product UI system for LeveCare — a portfolio demonstration of Brazilian doctor-guided weight-care telehealth (inspired by MEDVi / home.medvi.org, adapted for Brazil). This is NOT a real medical service. Every primary screen must show a clear but elegant demo disclaimer (Portuguese-first).

GOAL
Produce a coherent multi-screen design system + full app layout covering the entire patient journey that already exists in the product:

Funnel (MEDVi-style core): Landing → Eligibility assessment → Result → Book consultation → Patient account → LGPD consent → Demo digital prescription.

Do NOT invent payments checkout, medication shipping trackers, WhatsApp chat UIs, or live video consult rooms as primary screens — those are “real launch” concepts documented for the business, not in the current demo. You MAY show them only as muted “soon / real launch” placeholders in secondary marketing sections if they help the story, but the interactive system must match the live MVP flows below.

────────────────────────────────────────
PRODUCT POSITIONING (from MEDVi → Brazil)
────────────────────────────────────────
Reference model — MEDVi (US):
- Promise: “Healthcare redefined for real life” — online, simple, doctor-led, no waiting rooms.
- Funnel is the product: online assessment → licensed provider consult → prescription → recurring care.
- Marketing pillars: licensed providers, 100% online, clear pricing, care coaching / portal.
- Structural idea: platform + provider network (not a clinic owning every clinician).
- Verticals around the funnel (weight, meals, peptides, etc.) — LeveCare focuses on WEIGHT CARE only for Brazil.

LeveCare Brazil adaptations (important for copy & trust UI):
- Language: PT-BR primary, EN as secondary locale toggle.
- Plans in R$ with “sem fidelidade” (no lock-in) as a conversion lever.
- Trust cues: CRM number visible on provider cards; medical credibility without looking like a hospital portal.
- Channel story (marketing only): WhatsApp as primary care channel in Brazil; web portal is system of record.
- Regulatory honesty on UI: prescriptions are watermarked DEMOSTRATION / DEMONSTRAÇÃO; references to ICP-Brasil + SNCR are placeholders, never claim real validity.
- Competitor framing for tone (do not copy logos): Liti = premium high-touch BR care; Farmex = transactional Rx; LeveCare = middle — affordable recurring care + strong product UX (MEDVi-style middle market).

Brand name hierarchy:
- Wordmark: LeveCare (Leve + Care). “Leve” = light/easy in PT-BR; brand must dominate the first viewport — not a tiny nav logo.
- Headline never overpowers the brand name.

────────────────────────────────────────
CURRENT APP — SCREENS & FUNCTIONS TO DESIGN
────────────────────────────────────────
Design a full system layout for these screens (mobile + desktop). Treat them as one connected product, consistent chrome, shared components, shared spacing rhythm.

1) GLOBAL CHROME
- Sticky header: LeveCare wordmark (left), nav links Avaliação | Agenda | Painel, locale toggle PT/EN (right).
- Footer: strong legal/portfolio disclaimer (CFM, ICP-Brasil, ANVISA/SNCR, LGPD mentioned as study context), credit line, no clutter.
- Persistent soft demo banner or badge pattern reused across product screens (amber/neutral, not alarming red).

2) LANDING (/)
Sections in order — one job per section; hero is one composition (not a dashboard):
A. Hero (first viewport ONLY):
   - Brand (large)
   - One headline: e.g. “Cuidado médico para emagrecer, redesenhado para o Brasil”
   - One supporting sentence
   - One CTA group: primary “Começar avaliação gratuita” → /avaliacao ; secondary “Ver como funciona” → #features
   - Dominant full-bleed visual plane (lifestyle / calm care atmosphere — real people context, not abstract blobs). No floating badges/chips on the image. No stats strip in hero. No plan cards in hero.
B. How it works / features (#features):
   - Four items: Avaliação de elegibilidade | Médicos com CRM ativo | Prescrição digital | Acompanhamento contínuo
C. Plans:
   - Avulso R$89 / consulta (vídeo + receita, sem mensalidade)
   - Plano Cuidado R$149/mês (highlight) — consultas trimestrais, time de cuidado, plano nutricional, gestão de prescrição
   - Plano Completo R$299/mês — tudo do Cuidado + consultas mensais + logística de medicação + suporte prioritário
   - Plans are informational only (no payment flow). Highlight the middle plan like MEDVi’s “included everything” clarity.
D. Optional thin “Como funciona o fluxo” strip: Avaliação → Consulta → Consentimento LGPD → Receita demo — matching the real event pipeline.

3) ELIGIBILITY ASSESSMENT — Avaliação (/avaliacao)
Multi-step or single calm clinical form (prefer progressive steps if it elevates quality; keep fields the same):
Fields:
- Email
- Age
- Height (cm)
- Weight (kg)
- Comorbidities (multi-select): Diabetes tipo 2, Hipertensão, Apneia do sono, Dislipidemia
- Toggles: Gestante ou amamentando; Histórico de transtorno alimentar
- Submit: “Ver meu resultado”
Result states:
- Eligible: success tone, show calculated BMI, CTA “Agendar consulta” → /agenda
- Not eligible: calm neutral tone (not punitive), copy that this is not a diagnosis, encourage in-person care; NO booking CTA
Tone: clinical clarity + dignity. Feels like Apple Health questionnaire quality, not a marketing quiz.

4) BOOKING — Agenda (/agenda)
- Name, email
- Slot picker from mock providers: each slot shows datetime, provider name, CRM number
- Confirm → success state: “Consulta confirmada!” + note that demo email goes via SES
- Auth gate note: booking requires patient account (Cognito) — design a graceful “entre ou crie conta” path that can deep-link to Painel auth if needed
- Empty / error states for slots failing to load

5) PATIENT PANEL — Painel (/painel)
Authenticated area with clear stages:
A. Signed out: email + password, dual actions Entrar / Criar conta; microcopy “Autenticação real via Amazon Cognito”
B. Confirming: confirmation code entry after signup
C. Signed in empty: create patient record (name, email) → then show patient identity chip (name · email · id)
D. LGPD consent block (first-class UI, not a buried checkbox):
   - Purpose: “Tratamento de dados de saúde para acompanhamento clínico”
   - Actions: Conceder consentimento | Revogar
   - Visual state for granted / revoked (audit-friendly, trustworthy)
E. Prescription (demo) block:
   - Issue demo prescription — ENABLED only when consent granted === true
   - Download PDF after issue
   - Visual watermark language: DEMONSTRAÇÃO / not clinically valid
   - Optional preview of a Brazilian-style digital Rx layout (QR placeholder, CRM doctor placeholder, ICP-Brasil / SNCR placeholders clearly labeled fictícios)
F. Sign out

6) SUPPORTING SYSTEM ARTIFACTS (design as optional screens / components)
- Email confirmation mock (booking confirmed / prescription issued) — SES-style transactional, PT-BR, Apple Mail clean layout
- Empty states, loading skeletons, validation errors (gentle, specific)
- Component library sheet: buttons, inputs, selects, checkboxes, toggles, banners, plan cards, slot cards, consent status, auth forms, demo badge

────────────────────────────────────────
INFORMATION ARCHITECTURE / USER FLOW
────────────────────────────────────────
Primary happy path:
1. Land → read promise + plans
2. Start free assessment
3. Submit clinical data → see eligibility + BMI
4. If eligible → book slot with CRM-labeled provider
5. Sign up / sign in (Cognito)
6. Create patient profile
7. Grant LGPD consent (purpose-specific)
8. Issue watermarked demo Rx PDF → download
9. (Background product story) EventBridge events: intake.completed → booking.confirmed → prescription.issued → email notification

Branches:
- Not eligible → stop with dignified messaging
- Booking without auth → prompt sign-in
- Prescription without consent → CTA disabled + explanation why LGPD consent is required

────────────────────────────────────────
VISUAL / DESIGN SYSTEM (INDUSTRY REFERENCES)
────────────────────────────────────────
Primary craft reference: Apple Human Interface Guidelines + Apple Health / Fitness aesthetic.
- Typography: use SF Pro / SF Pro Display spirit (or closest: Inter is NOT preferred; prefer New York / SF-like pairing — Display for large titles, Text for UI/body). Expressive but calm. Large titles, tight tracking on display, generous leading on body. Clear hierarchy: Large Title → Title → Headline → Body → Caption → Footnote.
- Layout: generous whitespace, 8pt rhythm, max content width ~1080–1120px for marketing, tighter ~680–720px for forms. Edge-to-edge hero media on landing.
- Materials: subtle translucency / blur on sticky header (like iOS nav bars), hairline separators instead of heavy cards everywhere.
- Cards: prefer NO cards in hero. Cards only when they contain interaction (slot selection, plan choice, consent/prescription actions). If a border/shadow/radius can be removed without hurting understanding, remove it.
- Radius: soft but not bubbly (8–16px). Avoid pill clusters and rounded-full chip spam.
- Shadows: one soft elevation max; no multi-layer glow.
- Color: calm healthtech — deep forest/teal-green as brand accent is OK (current brand leans teal #0d9488), anchored by near-black slate text and warm off-white surfaces. Prefer atmospheric photo + soft gradient meshes over flat white. Avoid: purple-to-indigo SaaS gradients, terracotta+cream “AI brochure” look, neon glows, dark-mode-first, emoji icon rows, generic stock dashboard chrome.
- Iconography: SF Symbols style — minimal, monochrome, meaningful. Max one icon family.
- Motion (describe for handoff): 2–3 intentional motions only — e.g. hero fade/rise on load, sticky header material settle, form step cross-fade. No noisy parallax.
- Photography direction: Brazilian adult diversity, soft natural light, home/urban everyday (not sterile hospital OR gym bro-science). Brand feels trustworthy and modern.

Secondary product UX references (structure/clarity, not visual cloning):
- MEDVi marketing clarity: “everything included”, simple CTAs, doctor-guided GLP-1 narrative
- Apple Health: data dignity, consent clarity, quiet UI for sensitive health actions
- Linear / Stripe docs: precision for authenticated panels (not skeuomorphic medical gadgets)

Accessibility:
- Contrast AA+
- Large tap targets (44px)
- Visible focus states
- Form labels always visible (no placeholder-only fields)
- Error text adjacent to fields

────────────────────────────────────────
COPY RULES
────────────────────────────────────────
- PT-BR first in mockups; provide EN variants for the same layouts
- Always visible demo disclaimer on marketing + clinical screens
- Never imply the Rx is legally valid or that providers are real
- Prefer confident, short sentences (MEDVi directness + Brazilian warmth)
- Pricing in R$; “sem fidelidade” on plans

────────────────────────────────────────
DELIVERABLES REQUESTED FROM STITCH
────────────────────────────────────────
1. Design system tokens: color, type scale, spacing, radii, elevation, state colors (success / caution / error / info)
2. Component set: Header, Footer, DemoBadge, Button (primary/secondary/ghost/destructive), Input, Checkbox, Toggle, SlotCard, PlanCard, ConsentPanel, AuthForm, EmptyState, Toast/InlineError
3. Full screens (desktop + mobile):
   - Landing
   - Assessment form
   - Assessment result eligible / not eligible
   - Booking + confirmation
   - Auth sign-in / sign-up / confirm code
   - Dashboard: create patient → consent → issue Rx (can be one long screen or stepped)
4. A single “system overview” frame showing the flow map of all screens connected
5. Exportable handoff notes: fonts, hex tokens, and which screens map to routes /avaliacao /agenda /painel

CONSTRAINTS CHECKLIST
- Portfolio demo of telehealth weight care for Brazil (MEDVi-inspired)
- Match existing product functions; do not fake full pharmacy fulfillment checkout
- Brand-first landing hero; Apple-quality typography and calm HIG spacing
- CRM visible on provider slots; LGPD consent before prescription
- Demo / DEMONSTRAÇÃO watermark language on Rx and disclaimers
- No purple AI clichés, no emoji garnish, no hero overlay stickers, no stats dump in first viewport
```

---

## How to use with Stitch

1. Paste the prompt above as the **master brief**.
2. Generate the **system overview + tokens** first.
3. Then generate screen-by-screen with short follow-ups, e.g.:
   - “Now design only the Landing hero + features + plans using the tokens you defined.”
   - “Now Avaliacão form + eligible/not-eligible results, iPhone and desktop.”
   - “Now Agenda slot picker with CRM on each card.”
   - “Now Painel auth → patient → LGPD → demo Rx.”
4. If Stitch drifts into chat/shipping/payment UIs, reply: “Remove checkout and chat; stick to the MVP routes only.”

## Route ↔ screen map (for your review of Stitch output)

| Route | Screen |
|-------|--------|
| `/{pt\|en}/` | Landing + plans |
| `/{locale}/avaliacao/` | Eligibility intake + result |
| `/{locale}/agenda/` | Slot booking + confirmation |
| `/{locale}/painel/` | Cognito auth, patient, LGPD consent, demo Rx PDF |

## What exists today vs design target

| Today (repo) | Design target via Stitch |
|--------------|--------------------------|
| Functional but sparse Tailwind UI, teal accent | Full Apple-HIG–grade system |
| Card-heavy marketing sections | Brand-first hero, cards only for interaction |
| Single-page forms | Same fields, better hierarchy / progressive disclosure |
| Demo disclaimers present | More polished, always-on trust pattern |
