# LeveCare — Productization Study

> **Status:** Product brief for a portfolio demonstration project. LeveCare is not a real medical service. This study analyzes what it would take to bring a MEDVi-style ([home.medvi.org](https://home.medvi.org/)) doctor-guided weight-care platform to the Brazilian market, and documents which parts the demo intentionally mocks.
>
> Last updated: 2026-07-14

## 1. The reference model: MEDVi (US)

MEDVi sells **doctor-guided GLP-1 weight-loss care** as a vertically integrated subscription:

- Online eligibility assessment → async/video consultation with a licensed provider → prescription → compounded medication shipped monthly.
- Bundled services: 1:1 physician guidance, dietician visits, care coaching, 24/7 support, patient portal.
- Expansion into adjacent verticals from the same funnel: men's health, women's health, peptides, supplements, meal delivery ("MEDVi Meals"), hair and skin.
- Key structural choice: MEDVi is a **platform, not a clinic** — medical care is delivered by an independent provider network (OpenLoop Health) and medication by partner compounding pharmacies. MEDVi owns acquisition, UX, logistics orchestration, and billing.

The funnel is the product: **assessment → consult → prescription → recurring fulfillment**. Everything else (coaching, meals, supplements) increases LTV on top of that funnel.

## 2. Brazilian market landscape

### Demand signals

- Brazil is one of the largest obesity markets globally (~1 in 4 adults obese, over half overweight — Ministério da Saúde/IBGE trend data).
- GLP-1 demand exploded post-2023 (semaglutide, tirzepatide); retail prices of R$700–1.400+/month make cost and access the dominant consumer pain points.
- Telehealth is fully legal and normalized post-pandemic (Lei 14.510/2022), and Brazilian consumers are WhatsApp-first — care delivery over WhatsApp is an expectation, not a differentiator.

### Competitor teardown

| Player | Model | Price point | Notes |
|--------|-------|-------------|-------|
| **Liti** ([liti.com.br](https://liti.com.br/pt/)) | Subscription: assigned doctor + nutritionist, daily WhatsApp follow-up, AI assistant ("Lito"), prescription when clinically indicated | Premium subscription | Closest to MEDVi's care model. Strong medical brand (Dr. Eduardo Rauen, CBN). High-touch, retention-driven. |
| **Farmex** ([usefarmex.com.br](https://usefarmex.com.br/)) | Pay-per-consult: video consult + ICP-Brasil digital prescription via WhatsApp "in under 10 minutes" | R$59/consult, no subscription | Transactional "prescription access" model. Low LTV, low trust moat, high regulatory scrutiny risk. |
| **Manual** | Men's health telehealth (hair loss, ED, weight) with subscriptions + fulfillment | Mid-tier subscription | Category-adjacent; proves the DTC telehealth playbook works in Brazil. |
| Traditional endocrinologists + farmácias de manipulação | Offline incumbent | Consult R$300–600 | Fragmented; poor follow-up; the experience gap LeveCare-style products exploit. |

**Positioning gap:** Liti is premium/high-touch; Farmex is a cheap prescription transaction. The MEDVi-style middle — **affordable recurring care with bundled fulfillment and strong product UX** — is comparatively open in Brazil.

### Brazil-specific adaptations (vs. MEDVi US)

1. **Payments:** PIX (dominant), boleto, and installments (parcelamento) on cards are mandatory options; recurring PIX (Pix Automático, live since 2025) enables subscription billing without card penetration issues.
2. **Channel:** WhatsApp as the primary care-communication channel (Liti's model validates this), with the web portal as the system of record.
3. **Fulfillment:** partner with **farmácias de manipulação** (ANVISA RDC 67/2007) and/or retail chains (RaiaDrogasil, Pague Menos) for delivery; no MEDVi-style compounding network exists off the shelf.
4. **Trust:** CRM validation of doctors displayed prominently; Brazilian consumers verify. Named medical director matters (again, Liti's playbook).
5. **Pricing psychology:** monthly plans quoted in R$ with installments; "sem fidelidade" (no lock-in) is a strong conversion lever.

## 3. Regulatory map (the real moat)

Compliance is the hardest and most defensible part of this business. Requirements, in dependency order:

### Telemedicine practice

- **Lei 14.510/2022** — authorizes telehealth nationally, permanently.
- **Resolução CFM 2.314/2022** — regulates telemedicine: doctor–patient relationship rules, first-consult allowances, record-keeping, patient consent, and data safeguarding duties.

### Digital documents & prescriptions

- **Resolução CFM 2.299/2021** — electronic medical documents require **ICP-Brasil digital signature** at security level NGS2.
- **Lei 14.063/2020** — legal framework for electronic signature levels in healthcare.
- **ANVISA RDC 873/2024** — created the **SNCR** (Sistema Nacional de Controle de Receituários) and first technical requirements for electronic controlled prescriptions.
- **ANVISA RDC 1.000/2025** — consolidates digital prescription of controlled medications (Portaria 344/98 lists, including yellow/blue special prescriptions). Key operational facts:
  - Prescriptions must be **natively digital** (not scanned paper).
  - **Qualified (ICP-Brasil) signature** required for Portaria 344/98 controlled meds; qualified **or advanced (gov.br)** accepted for antimicrobials and **GLP-1 agonists**.
  - Patient **CPF mandatory** on all controlled prescriptions; single-use receituários registered in SNCR.
  - **SNCR full operation due June 1, 2026** — after go-live, controlled prescriptions without SNCR numbering are accepted for only 30 days. Platform integration with the SNCR API is now table stakes for this business.
  - Pharmacy-side validation via **QR code** on the digital prescription.

Sources: [Tamarin GLP-1 prescription guide](https://tamarin.com.br/articles/artigo-receita-anvisa-glp1.html), [Instituto CDT on electronic prescriptions](https://institutocdt.com.br/blog/prescricao-eletronica-obrigatoriedade/).

### Data protection

- **LGPD** — health data is *dado sensível* (art. 5º, II; art. 11): explicit, purpose-specific consent; DPO (encarregado); RIPD (data protection impact assessment); breach notification to ANPD; international transfer rules if using foreign cloud regions.
- Practical implications for architecture (implemented in the demo): consent records as first-class data, purpose limitation per data category, audit trails, data residency in **AWS sa-east-1 (São Paulo)** as the default posture, encryption at rest and in transit.
- Reference: [Confidata — Telemedicina e LGPD](https://confidata.com.br/blog/telemedicina-lgpd-guia-completo-plataformas).

### Medication supply

- Compounded GLP-1 ("semaglutida manipulada") sits in a contested gray zone — ANVISA and manufacturers have pressured compounding of patented molecules. A durable business should plan for **branded/generic retail fulfillment partnerships** rather than depending on compounded supply (a real divergence from MEDVi's US model).

## 4. Business model

### Recommended model: hybrid subscription

- **Plano Cuidado** — R$149/mo: quarterly video consults, WhatsApp care team, nutrition plan, prescription management (medication paid separately at partner pharmacy with negotiated discount).
- **Plano Completo** — R$299–449/mo: everything above + medication logistics orchestration + monthly dose-adjustment consults.
- **Avulso** — R$89 single consult (Farmex-style top-of-funnel; converts to subscription).

### Unit economics sketch (Plano Cuidado)

| Line | Est. monthly |
|------|--------------|
| Revenue | R$149 |
| Medical network cost (amortized consults + async) | R$45–60 |
| Care team / support (pooled) | R$15–25 |
| Payments + infra + tooling | R$8–12 |
| **Contribution margin** | **~R$55–80 (37–54%)** |

CAC in this category is high (paid social + influencer-heavy); retention (dose titration takes 6–12 months) is the economic engine — same reason MEDVi and Liti invest in coaching and proactive follow-up.

### Moats, in order of strength

1. **Regulatory infrastructure** — ICP-Brasil signing + SNCR integration + LGPD posture done properly is months of work and real certification cost.
2. **Medical network liquidity** — credentialed CRM-active prescribers with capacity.
3. **Retention system** — proactive WhatsApp follow-up, dose management, outcomes data.
4. Brand/trust — slowest to build, strongest at scale.

## 5. What the demo mocks vs. a real launch

| Capability | Demo (this repo) | Real launch requirement |
|------------|------------------|-------------------------|
| Doctor consultations | Mock provider slots, no video | Credentialed medical network (own CRM-registered doctors or partner like OpenLoop's BR equivalent), video infra |
| Prescription | Demo PDF with QR placeholder, clearly watermarked "DEMONSTRAÇÃO" | ICP-Brasil NGS2 qualified signature + SNCR API integration + single-use receituário |
| Eligibility screening | Rules-based scoring (BMI, comorbidities) in Go service | Clinically validated protocol reviewed by medical director; exclusion criteria per CFM guidance |
| Payments | None (plans page only) | PIX Automático + cards with installments (Pagar.me/Stripe BR) |
| Medication fulfillment | Not modeled | Pharmacy partnerships, logistics, cold chain for injectables |
| LGPD | Consent records, audit fields, sa-east-1 residency, encryption | + DPO, RIPD, ANPD processes, retention policies, DSR tooling |
| Communication | SES email (sandbox) | WhatsApp Business API as primary channel |

## 6. Why this architecture serves the product

- **Serverless scales-to-zero** — matches a pre-revenue product's cost curve (near R$0 idle) while handling launch spikes without re-architecture.
- **Polyglot microservices** — the clinical core (patients, consent, prescriptions) needs the Java/Spring ecosystem's maturity (validation, auditing, eventual HL7/FHIR libraries); high-throughput edge concerns (intake scoring, notifications) suit Go's cold-start and cost profile.
- **Event-driven (EventBridge)** — clinical workflows are naturally event-shaped (intake completed → consult booked → prescription issued → notification sent), and async decoupling keeps each service independently deployable and auditable — an LGPD advantage.

See [architecture.md](architecture.md) for the technical decisions record.
