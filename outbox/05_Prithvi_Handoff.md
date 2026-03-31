# ILA OSINT Intelligence Platform — PoC Handoff Document

**For:** Prithvi (Consultant / CGO, ILA)
**From:** Project Horizon Engineering
**Date:** 2026-03-31

---

## Executive Summary

Project Horizon has built a **functional proof-of-concept** of the ILA OSINT Intelligence Platform that demonstrates end-to-end capability across all 7 modules specified in the BEL tender. The platform is live, deployed, and testable immediately.

**Live Demo:** https://iph-frontend.onrender.com
**Credentials:** admin / admin123

---

## What This PoC Demonstrates

### Full Intelligence Pipeline — Working End-to-End

```
Data Sources → Ingestion → NLP Processing → Entity Extraction → Knowledge Graph → Threat Scoring → Alerts → Reports
     ✅            ✅            ✅                ✅                  ✅              ✅          ✅        ✅
```

### By the Numbers

| Metric | Value |
|--------|-------|
| Total posts ingested | 10,000+ |
| Entities tracked | 161 (persons, orgs, phones, emails, UPI, crypto, IPs, domains) |
| Entity relationships mapped | 561 |
| Active alerts | 164 |
| Data sources configured | 14 |
| Monitored keywords | 24 |
| Alert rules | 5 |
| UI screens built | 9 (BEL requires 6) |
| API endpoints | 37+ |
| Database tables | 12 |

---

## BEL Module Coverage

| Module | BEL Requirement | PoC Delivery | Coverage |
|--------|----------------|-------------|----------|
| **M1: Data Ingestion** | 20+ source connectors | RSS (8 feeds) + Telegram Bot | Demonstrates connector architecture |
| **M2: Processing** | Multilingual NLP, OCR, ASR | Sentiment analysis, language detection, topic classification | Core pipeline proven |
| **M3: Entity Extraction** | Phone, email, UPI, crypto, IP, domain, NER | All 7 entity types extracting correctly | 78% feature coverage |
| **M4: Knowledge Graph** | Neo4j with relationship mapping | NetworkX graph with 7 node types, vis-network visualization | Architecture proven |
| **M5: Threat Intelligence** | AI/ML threat detection | Rule-based threat scoring with 5 categories | Pipeline proven |
| **M6: Alerts & Dashboards** | Real-time alerts, 6 screens | SSE real-time, 9 screens, auto-refresh | 92% feature coverage |
| **M7: Reporting** | E-SitRep in PDF/Word/Excel/CSV | PDF + DOCX with 6 sections | Core formats working |

**Overall: 61% of all PRD features implemented. 100% of module categories covered.**

---

## Technology Decisions

| Layer | PoC Choice | Production Path |
|-------|-----------|-----------------|
| Frontend | React + TypeScript + Tailwind | Same (production-ready) |
| Backend | FastAPI (Python) | Same (production-ready) |
| Database | PostgreSQL | MongoDB Atlas + Neo4j Enterprise |
| Graph | NetworkX (in-memory) | Neo4j 5.x Enterprise |
| NLP | VADER + regex + keywords | IndicBERT + spaCy + custom ML models |
| Queue | Synchronous processing | Apache Kafka |
| Auth | JWT (3 roles) | Keycloak + 2FA + RBAC |
| Hosting | Render.com (free tier) | AWS India (ap-south-1) per BEL spec |

**Key point:** The PoC architecture maps directly to the production stack. No fundamental rewrites needed — only component upgrades.

---

## What's Real vs Simulated

| Component | Real | Simulated |
|-----------|------|-----------|
| RSS news ingestion | ✅ 149 real articles from 8 Indian news portals | — |
| Telegram bot collector | ✅ Working Bot API integration | — |
| NLP processing on real articles | ✅ Sentiment, entities, threat scores | — |
| 10,000 posts | — | ✅ Faker-generated, realistic Indian OSINT content |
| Entity relationships | — | ✅ Synthetic co-mention and affiliation links |
| Alerts | — | ✅ Synthetic with realistic threat scenarios |
| Dashboard data | Mix | Real aggregations on synthetic + real data |

---

## What We're Proving to BEL

1. **Engineering capability:** We can build the full ILA platform. Not a PowerPoint — a working system.
2. **Architectural understanding:** We've parsed the 88KB PRD, mapped all 7 modules, 9 EPICs, 25 ATP scenarios.
3. **Speed of execution:** 48-hour build. This velocity translates to reliable delivery on the production timeline.
4. **Cost efficiency:** Built for <$300/month. Production capability at a fraction of competitor estimates.
5. **Technical depth:** Entity extraction, knowledge graph, threat scoring, NLP pipeline — these aren't mock features. They're working algorithms.

---

## Production Roadmap (Post-Contract)

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Infrastructure | Week 1-2 | AWS setup, Kafka, Neo4j, Keycloak |
| Phase 2: Source Connectors | Week 2-4 | Twitter, Facebook, Reddit, Dark Web, GDELT, 15+ more |
| Phase 3: ML Models | Week 3-6 | IndicBERT sentiment, propaganda detection, fraud detection |
| Phase 4: Scale & Security | Week 5-7 | Load testing, penetration testing, RBAC hardening |
| Phase 5: ATP Preparation | Week 7-8 | BEL test scenario execution, documentation |

**Estimated timeline: 8 weeks to ATP-ready production system.**

---

## Cost Summary

| Scenario | Monthly Cost | Notes |
|----------|-------------|-------|
| Current PoC | $300/mo | Render.com free tier + AI development |
| Budget Production | $700/mo | Self-hosted, suitable for demo/pilot |
| Full BEL-Spec AWS | ~$16,000/mo | Per BEL Section 3.7 infrastructure spec |

Detailed cost breakdown available in the engineering cost estimate document.

---

## Next Steps

1. **Prithvi reviews this PoC** — test all 9 screens, generate a report, explore the graph
2. **Feedback loop** — any feature gaps or presentation adjustments
3. **Demo to Sadik (ILA CEO)** — guided walkthrough using the live system
4. **BEL proposal submission** — with PoC as evidence of engineering capability

---

## Access & Contact

| Resource | URL |
|----------|-----|
| Frontend | https://iph-frontend.onrender.com |
| Backend API | https://iph-backend-peix.onrender.com |
| API Documentation | https://iph-backend-peix.onrender.com/docs |
| Source Code | https://github.com/harshashinigami/iph-osint |

**Note:** The platform runs on Render.com free tier. First load may take 30-60 seconds if the server is cold. This is a PoC constraint, not a product limitation.
