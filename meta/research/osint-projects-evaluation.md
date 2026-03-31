# Open-Source OSINT Projects — Evaluation for ILA PoC

**Last Updated:** 2026-03-31

## TIER 1: Full Platforms We Could Fork/Adapt

### 1. osint-worldview (FastAPI + React + Celery + PostgreSQL)
- **GitHub:** https://github.com/amanimran786/osint-worldview
- **Tech Stack:** FastAPI, React, Celery, PostgreSQL — EXACT match to our planned stack
- **What it does:** Full-stack OSINT Threat Detection & Triage platform
  - Telegram OSINT (26 channels via MTProto with dedup and topic classification)
  - OREF rocket alerts
  - Prediction markets (Polymarket)
  - 22 typed service domains with auto-generated clients
  - 3-tier caching (memory → Redis → upstream)
  - Sub-second first render with bootstrap hydration
- **Relevance:** HIGH — closest match to our architecture. FastAPI + React + PostgreSQL.
- **Adaptation potential:** Fork and add our modules (entity extraction, graph, reporting)

### 2. World Monitor / osintmonitor
- **GitHub:** https://github.com/marcko80/osintmonitor (also https://github.com/koala73/worldmonitor)
- **Live demo:** https://www.worldmonitor.app/
- **What it does:** Real-time global intelligence dashboard
  - AI-powered news aggregation
  - Geopolitical monitoring
  - Infrastructure tracking
  - 4 variants: World, Tech, Finance (92 stock exchanges), Social
  - ML pipeline runs IN BROWSER via Transformers.js
  - 16-language UI
- **Relevance:** HIGH for the dashboard/UI layer. The Finance variant with stock exchanges is close to what ILA CEO wants to see (cascading industry impacts)
- **Adaptation potential:** Study the dashboard layouts and data aggregation patterns

### 3. WORLDVIEW (SvelteKit OSINT Command Center)
- **GitHub:** https://github.com/Prathewsh/worldview
- **Live demo:** https://osint-worldview.vercel.app/
- **What it does:** Real-time intelligence command center
  - Geospatial intelligence with live earthquake/tectonic data
  - Orbital tracking (ISS via Three.js + Globe.gl)
  - Financial intelligence
  - Signal intelligence
  - CORS-bypass via SvelteKit server-side relays
- **Relevance:** MEDIUM — SvelteKit (not React), but excellent UX patterns and data source integrations
- **Adaptation potential:** Study the data source aggregation architecture

### 4. IntellyWeave (FastAPI + Next.js + Weaviate)
- **GitHub:** https://github.com/vericle/intellyweave
- **What it does:** AI-powered OSINT intelligence analysis
  - GLiNER entity extraction (zero-shot NER — very relevant)
  - Mapbox 3D geospatial visualization
  - Network analysis with vis-network
  - Document processing
  - Multi-agent AI debate system
  - Hypothesis-driven investigation
- **Tech Stack:** FastAPI, Next.js, Weaviate, DSPy
- **Relevance:** HIGH — entity extraction + graph + geo is exactly our Module 3+4+6
- **Adaptation potential:** Borrow the entity extraction pipeline and graph visualization

### 5. OpenCTI (Cyber Threat Intelligence Platform)
- **GitHub:** https://github.com/OpenCTI-Platform/opencti
- **What it does:** Full cyber threat intelligence platform
  - Knowledge graph (STIX2-based)
  - Entity management
  - Dashboards
  - Report generation
  - 100+ connectors
- **Tech Stack:** React, Python, Neo4j, Elasticsearch, GraphQL, Redis, RabbitMQ
- **License:** Apache 2.0
- **Relevance:** MEDIUM-HIGH — most complete platform but very heavy. Too complex to fork for PoC.
- **Adaptation potential:** Study the architecture. Too heavy to deploy as-is on Render.

## TIER 2: Module-Specific Tools

### Entity Extraction
| Project | GitHub | Use Case |
|---------|--------|----------|
| SpiderFoot | https://github.com/smicallef/spiderfoot | 200+ OSINT modules, Python, MIT. Plugin architecture for data collection. |
| Microsoft Presidio | https://github.com/microsoft/presidio | PII detection REST API. Pre-built for phones, emails, crypto, IPs. Add UPI custom. MIT. |
| spaCy | Built-in | NER for person/org/location. en_core_web_sm model. |
| phonenumbers (Google) | pip install phonenumbers | Parse/validate phone numbers in Indian formats |

### Graph Visualization
| Project | GitHub | Use Case |
|---------|--------|----------|
| vis-network | npm vis-network | Force-directed graph in browser. Used by IntellyWeave. |
| react-force-graph | npm react-force-graph-2d | Alternative React graph component, WebGL-based |
| Cytoscape.js | npm cytoscape | Graph analysis + visualization library |
| NetworkX | pip install networkx | Backend graph algorithms (community detection, shortest path) |

### Geospatial
| Project | GitHub | Use Case |
|---------|--------|----------|
| Kepler.gl | https://github.com/keplergl/kepler.gl | Drop-in React geo component. Heatmaps, clusters, time playback. MIT. |
| react-leaflet | npm react-leaflet | Lightweight mapping. Good for India district-level views. |
| GDELT API | https://github.com/linwoodc3/gdeltPyR | Free global event data, updated every 15 min. Geocoded. |

### Sentiment & NLP
| Project | GitHub | Use Case |
|---------|--------|----------|
| VADER Sentiment | pip install vaderSentiment | Fast rule-based sentiment. Works well for social media text. |
| TextBlob | pip install textblob | Simple sentiment API |
| Transformers.js | npm @xenova/transformers | Client-side ML (sentiment, classification) — zero backend cost |

### Report Generation
| Library | Install | Use Case |
|---------|---------|----------|
| fpdf2 | pip install fpdf2 | Pure Python PDF generation. No native deps. |
| python-docx | pip install python-docx | Word document generation |
| openpyxl | pip install openpyxl | Excel generation |
| Jinja2 | pip install jinja2 | HTML templates for reports |

## TIER 3: Data Sources (Free)

| Source | API/Method | Cost | Module |
|--------|-----------|------|--------|
| GDELT | REST API, updates every 15 min | Free | Ingestion, Geo, Events |
| RSS feeds (Indian news) | feedparser | Free | Ingestion |
| Telegram public channels | Telethon | Free (needs phone) | Ingestion |
| Reddit | PRAW/asyncpraw | Free tier | Ingestion |
| Wikipedia/Wikidata | REST API | Free | Entity enrichment |
| AbuseIPDB | REST API | Free tier (1K queries/day) | Threat intel |
| Shodan | REST API | Free tier limited | Cyber threat |
| VirusTotal | REST API | Free tier (4 req/min) | Cyber threat |

## RECOMMENDATION: Fork Strategy

**Primary fork candidate:** `osint-worldview` — it's FastAPI + React + PostgreSQL, exactly our stack.

**What we'd add on top:**
1. Entity extraction layer (spaCy + regex + Presidio patterns)
2. Knowledge graph visualization (vis-network)
3. India-specific data sources (RSS Indian news, GDELT India filter)
4. Report generation (fpdf2 + python-docx)
5. Alert system with rules engine
6. Synthetic data seeder for demo

**Alternative approach:** Build from scratch using the architecture patterns from osint-worldview + IntellyWeave + World Monitor, picking the best ideas from each.
