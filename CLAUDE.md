# ILA OSINT Intelligence Platform — Proof of Concept

## Project Identity
- **Project:** ILA OSINT PoC (codename: IPH)
- **Company:** Project Horizon (Harsha, CEO)
- **Client:** ILA (CEO: Sadik) via Prithvi (consultant)
- **Objective:** Demonstrate engineering capability to win OSINT platform subcontract for BEL government tender
- **PRD Source:** `inbox/ILA_OSINT_Engineering_Package.docx`

## Session Initialization Checklist
On every new session, Claude MUST:
1. Read this file first
2. Check `meta/status.md` for current progress and blockers
3. Check task list for pending/in-progress items
4. Read the latest trail-of-thought entry in `meta/trail-of-thought/`
5. Resume from last known state — never restart from zero

## Constraints
- **Budget:** ~$200/month Claude Max subscription covers all paid APIs
- **Hosting:** Render.com (NOT AWS — no budget for production infra)
- **Data:** Free sources + synthetic data where paywalls exist
- **Speed:** Ship fast. Adapt open-source, don't build from scratch
- **Scope:** PoC only — enough to prove capability, not production-grade

## Collaboration Rules
- **Anti-sycophancy:** Disagree when wrong. No sugarcoating. Direct feedback.
- **Inference logging:** Every significant decision/finding → markdown in `meta/`
- **Session resilience:** All progress persisted. Context window is volatile.
- **Directory autonomy:** Claude has full control over file/folder organization

## Directory Structure
```
iph/
├── CLAUDE.md                    # This file — session init
├── inbox/                       # Incoming documents from ILA
│   └── ILA_OSINT_Engineering_Package.docx
├── meta/                        # Project metadata (session-resilient)
│   ├── status.md                # Current progress, blockers, next steps
│   ├── trail-of-thought/        # Decision logs, reasoning chains
│   ├── breakthroughs/           # Key discoveries, working solutions
│   ├── archives/                # Past conversation summaries
│   └── research/                # OSINT project evaluations, tech comparisons
├── docs/                        # Architecture docs, diagrams, specs
└── src/                         # Application source code
```

## Tech Stack (PoC — subject to revision)
- **Backend:** FastAPI (Python)
- **Frontend:** React + TypeScript (Vite)
- **Database:** PostgreSQL (Render managed) + pg_trgm for search
- **Graph:** NetworkX (in-memory) or lightweight Neo4j community
- **Queue:** Redis or simple background tasks (no Kafka for PoC)
- **NLP:** spaCy + lightweight HuggingFace models
- **Deploy:** Render.com (web service + database + Redis)

## What the PRD Contains (7 Modules)
1. **Data Ingestion** — 20+ source connectors (social, news, dark web, search)
2. **Processing/Enrichment** — NLP, translation, OCR, ASR, dedup, classification
3. **Entity Extraction** — Phone, email, UPI, bank, crypto, IP, domain, NER
4. **Knowledge Graph** — Neo4j relationship mapping, coordination detection, network analysis
5. **Threat Intelligence** — Sentiment, propaganda, misinfo, financial fraud, anomaly detection
6. **Alerts & Dashboards** — Real-time alerts, 6 dashboard screens, RBAC
7. **Reporting** — E-SitRep PDF/Word/Excel/CSV generation

## PoC Strategy
Adapt existing open-source OSINT projects rather than building from scratch.
Demonstrate the full pipeline (ingest → process → extract → graph → alert → report) with:
- 3-5 real free data sources (Twitter/X via Nitter, RSS news, Telegram public)
- Synthetic data for paywalled sources
- Working dashboard with all 6 screens (can have simulated data)
- One working E-SitRep export
- Entity graph visualization
- Real-time alert simulation
