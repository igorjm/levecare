# AGENTS.md — LeveCare

Guidance for AI agents working in this repository.

## Project in one line

**LeveCare** is a portfolio demonstration of Brazilian doctor-guided weight-care telehealth (MEDVi-style, Brazil-adapted), built as polyglot serverless microservices on AWS (Java clinical core + Go edge services + Next.js on CloudFront), near $0/month. It is **not** a real medical product.

## Before changing architecture

1. Read `docs/architecture.md` (ADRs) and `docs/productization.md`.
2. Respect locked decisions: serverless AWS, Java SnapStart for patients, Go for intake/scheduling/notification, DynamoDB per service, CDK + GitHub OIDC.
3. Preserve demo-safe medical boundaries (watermarked Rx, mock providers, no payments, SES sandbox).

## Cursor rules

Project rules under `.cursor/rules/` always apply:

- `project-context.mdc` — goals and locked stack
- `cost-and-compliance.mdc` — free-tier + regulatory/demo boundaries
- `repo-conventions.mdc` — layout, builds, event/API patterns

## Preferred next work

When the user asks what to do next without a specific task, prefer:

1. First AWS deploy (bootstrap + OIDC + SES verify) if not done
2. Observability polish / README cost proof from a live stack
3. Portfolio screenshot + live `SiteUrl` once CloudFront is up
4. Deepening productization (WhatsApp channel design, PIX Automático sketch) without pretending SNCR is integrated

## Do not

- Add NAT/VPC, RDS, provisioned concurrency, or custom domains without an explicit ask and cost callout
- Ship real prescription signing, SNCR, or payment code presented as production-ready
- Relocate the frontend to Vercel (AWS story is intentional)
- Edit sibling portfolio/career files unless asked
