# ILA OSINT Platform — PoC Feature Checklist

**Date:** 2026-03-31
**Live URLs:**
- Frontend: https://iph-frontend.onrender.com
- Backend: https://iph-backend-peix.onrender.com
- API Docs: https://iph-backend-peix.onrender.com/docs

**Login Credentials:**
- admin / admin123 (Administrator)
- analyst / analyst123 (Analyst)
- viewer / viewer123 (Viewer)

---

## Module 1 — Data Ingestion ⚡ Partial

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M1-01 | X (Twitter) Connector | ❌ Not built | Requires paid API ($5K/mo) |
| M1-02 | Facebook Connector | ❌ Not built | Requires CrowdTangle access |
| M1-03 | Telegram Connector | ✅ **Working** | Bot API, polls getUpdates |
| M1-04 | Reddit Connector | ❌ Not built | Free API available |
| M1-05 | News/RSS Connector | ✅ **Working** | 8 Indian news feeds live |
| M1-06 | Dark Web Connector | ❌ Not built | Requires Tor infrastructure |
| M1-07 | GDELT Connector | ❌ Not built | Free API available |
| M1-08 | WhatsApp Connector | ❌ Not built | No public API |
| M1-09 | Keyword Management | ✅ **Working** | CRUD API + UI |
| M1-10 | Source Management | ✅ **Working** | Sources page with toggle |

## Module 2 — Processing & Enrichment ⚡ Partial

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M2-01 | Language Detection | ✅ **Working** | langdetect library |
| M2-02 | Machine Translation | ❌ Not built | Requires IndicTrans2 + GPU |
| M2-03 | OCR (Image Text) | ❌ Not built | Tesseract/EasyOCR available |
| M2-04 | ASR (Audio Transcription) | ❌ Not built | Whisper model available |
| M2-05 | Deduplication | ❌ Not built | MinHash/SimHash needed |
| M2-06 | Content Classification | ⚡ Basic | Keyword-based topic tagging |

## Module 3 — Entity Extraction ✅ Core Working

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M3-01 | Phone Number Extractor | ✅ **Working** | Regex: +91 and 10-digit Indian |
| M3-02 | Email Extractor | ✅ **Working** | RFC-compliant regex |
| M3-03 | UPI ID Extractor | ✅ **Working** | Regex: *@paytm/gpay/upi/etc |
| M3-04 | Crypto Wallet Extractor | ✅ **Working** | BTC + ETH regex patterns |
| M3-05 | IP Address Extractor | ✅ **Working** | IPv4 regex |
| M3-06 | Domain Extractor | ✅ **Working** | .com/.org/.in/.gov.in regex |
| M3-07 | Named Entity Recognition | ⚡ Basic | Keyword-based (10 persons, 30+ orgs) |
| M3-08 | Bank Account Extractor | ❌ Not built | Regex pattern needed |
| M3-09 | Entity Resolution | ❌ Not built | Dedup + merge logic needed |

## Module 4 — Knowledge Graph ⚡ Simplified

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M4-01 | Graph Database | ⚡ Simplified | NetworkX (in-memory) vs Neo4j |
| M4-02 | Graph Visualization | ✅ **Working** | vis-network with color-coded nodes |
| M4-03 | Shortest Path | ✅ **Working** | NetworkX shortest_path |
| M4-04 | Community Detection | ❌ Not built | Louvain available in NetworkX |
| M4-05 | Entity Co-occurrence | ✅ **Working** | Co-mention relationships |
| M4-06 | Temporal Analysis | ❌ Not built | Time-series graph evolution |

## Module 5 — Threat Intelligence ⚡ Rule-Based

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M5-01 | Sentiment Analysis | ✅ **Working** | VADER (English only) |
| M5-02 | Propaganda Detection | ❌ Not built | Requires trained classifier |
| M5-03 | Financial Fraud Detection | ❌ Not built | Requires ML model |
| M5-04 | Anomaly Detection | ❌ Not built | Volume spike detection |
| M5-05 | Threat Scoring | ✅ **Working** | Keyword-based scoring (0-1.0) |
| M5-06 | Threat Categorization | ✅ **Working** | 5 categories: terrorism, fraud, cyber, violence, propaganda |
| M5-07 | Geo-location Detection | ✅ **Working** | 15 Indian cities with lat/lon |

## Module 6 — Alerts & Dashboards ✅ Feature Complete

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M6-01 | Real-time Alert Engine | ✅ **Working** | Auto-generated from NLP pipeline |
| M6-02 | Alert History | ✅ **Working** | Full CRUD + acknowledge |
| M6-03 | Alert Rules | ✅ **Working** | CRUD for custom rules |
| M6-04 | SSE Real-time Push | ✅ **Working** | /alerts/stream endpoint |
| M6-05 | Dashboard KPIs | ✅ **Working** | 5 stat cards |
| M6-06 | Volume Timeline | ✅ **Working** | Stacked bar chart |
| M6-07 | Platform Breakdown | ✅ **Working** | Horizontal bars |
| M6-08 | Sentiment Overview | ✅ **Working** | Positive/negative/neutral bars |
| M6-09 | Threat Gauge | ✅ **Working** | Score + high-threat count |
| M6-10 | Geo Map | ✅ **Working** | Leaflet India map with markers |
| M6-11 | Entity Leaderboard | ✅ **Working** | Top 10 by mentions |
| M6-12 | Trending Topics | ✅ **Working** | Topic cloud |
| M6-13 | RBAC (Role-Based Access) | ⚡ Basic | 3 roles via JWT (no Keycloak) |

## Module 7 — Reporting ✅ Core Working

| Ref | PRD Feature | PoC Status | Implementation |
|-----|------------|------------|----------------|
| M7-01 | E-SitRep PDF | ✅ **Working** | 6-section report with download |
| M7-02 | E-SitRep DOCX | ✅ **Working** | Word format with download |
| M7-03 | Excel Export | ❌ Not built | openpyxl ready in deps |
| M7-04 | CSV Export | ❌ Not built | Simple to add |
| M7-05 | Report History | ✅ **Working** | List + download previous |
| M7-06 | Weekly Analysis Report | ❌ Not built | Template needed |

---

## UI Screens

| Screen | PRD Requirement | PoC Status |
|--------|----------------|------------|
| Login | ✅ Built | Shield branding, demo credentials, auth |
| Dashboard | ✅ Built | 10 widgets, auto-refresh, geo map |
| Search | ✅ Built | Full-text search with platform filters |
| Sources | ✅ Built | Source management, RSS/Telegram collect |
| Keywords | ✅ Built | CRUD table |
| Entity Graph | ✅ Built | vis-network, filters, detail panel |
| Alerts | ✅ Built | SSE live feed, severity filters, acknowledge |
| Reports | ✅ Built | PDF/DOCX generation + download |
| Settings | ✅ Built | Profile, health, rules, data management |

**Total: 9 screens built (PRD requires 6)**

---

## Summary Score

| Module | PRD Features | Implemented | Coverage |
|--------|-------------|-------------|----------|
| M1: Ingestion | 10 | 4 | 40% |
| M2: Processing | 6 | 2 | 33% |
| M3: Entity Extraction | 9 | 7 | 78% |
| M4: Knowledge Graph | 6 | 3 | 50% |
| M5: Threat Intel | 7 | 4 | 57% |
| M6: Alerts & Dashboards | 13 | 12 | 92% |
| M7: Reporting | 6 | 3 | 50% |
| **Overall** | **57** | **35** | **61%** |

**For a PoC built in 1 day with $0 infrastructure cost, 61% feature coverage across all 7 modules is strong.**
