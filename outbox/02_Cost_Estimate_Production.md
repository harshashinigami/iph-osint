# ILA OSINT Platform — Production Cost Estimate

**Prepared by:** Project Horizon Engineering
**Date:** 2026-03-31
**Classification:** Internal — For Prithvi Review

---

## 1. PoC Phase Cost (Current — What We're Spending)

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Claude Max Subscription | $200 | Opus + Sonnet for development |
| Add-on Tools (OpenRouter, MCP, etc.) | $100 | Free models + minor API costs |
| Render.com (Free Tier) | $0 | Backend + Frontend + PostgreSQL |
| GitHub (Free) | $0 | Code repository |
| Domain (optional) | $0 | Using render.com subdomain |
| **Total PoC Monthly** | **$300** | |

**PoC Total Estimate:** $300-400/month for 2-3 months = **$600-1,200**

---

## 2. Production Infrastructure Cost (AWS — per BEL Spec)

### Compute (EC2)
| Instance | Spec | Count | Monthly Cost |
|----------|------|-------|-------------|
| r6g.4xlarge (App Server) | 16 vCPU, 128GB RAM | 1 | $780 |
| r6g.8xlarge (Scraping Servers) | 32 vCPU, 256GB RAM | 3 | $5,880 |
| g5.4xlarge (ML/NLP Server) | 16 vCPU, 64GB RAM, GPU | 1 | $1,624 |
| **Compute Total** | | | **$8,284/mo** |

### Data Layer
| Service | Spec | Monthly Cost |
|---------|------|-------------|
| MongoDB Atlas (M50 cluster) | 3-node replica set | $1,050 |
| Neo4j Enterprise (self-hosted on EC2) | Included in r6g.4xlarge | $0 (license ~$500) |
| Amazon S3 | 1TB storage + transfer | $50 |
| ElastiCache (Redis) | r6g.large | $200 |
| **Data Total** | | **$1,800/mo** |

### Platform Services
| Service | Monthly Cost |
|---------|-------------|
| Apache Kafka (MSK) | $450 |
| Keycloak (self-hosted) | $0 (on App Server) |
| CloudWatch + logging | $100 |
| AWS WAF + Shield | $50 |
| Route 53 + ACM | $10 |
| **Platform Total** | **$610/mo** |

### API Costs (Data Sources)
| API | Monthly Cost | Notes |
|-----|-------------|-------|
| Twitter/X API (Pro) | $5,000 | 1M tweets/month search |
| CrowdTangle (Facebook) | By application | Free for researchers |
| Reddit API | $0 | Free tier sufficient |
| Telegram API | $0 | Free (Bot API) |
| GDELT | $0 | Free |
| Google Trends | $0 | Unofficial API |
| VirusTotal | $0-100 | Free tier + premium |
| **API Total** | **~$5,100/mo** | Twitter is the big cost |

### **Total Production Infrastructure: ~$15,800/month**

---

## 3. Development Cost Estimate

### Team (per BEL Tender — 5-day sprint + ongoing)

| Role | Duration | Rate (India) | Cost |
|------|----------|-------------|------|
| Backend/Ingestion Dev | 3 months | ₹2-3L/mo | ₹6-9L |
| Graph/ML/NER Dev | 3 months | ₹2.5-4L/mo | ₹7.5-12L |
| Frontend Dev | 3 months | ₹2-3L/mo | ₹6-9L |
| DevOps | 2 months | ₹2-3L/mo | ₹4-6L |
| Project Manager | 3 months | ₹1.5-2L/mo | ₹4.5-6L |
| **Dev Team Total** | | | **₹28-42L ($33-50K)** |

### AI-Assisted Development (Our Approach)
| Resource | Duration | Cost |
|----------|----------|------|
| Claude Max (Opus+Sonnet) | 3 months | $600-900 |
| OpenRouter/Free Models | 3 months | $100-300 |
| Harsha (CEO/Architect) | 3 months | Internal |
| **AI-Dev Total** | | **$700-1,200** |

**Cost savings using AI-assisted development: ~97% vs traditional team**

---

## 4. Economical Production Stack (Budget-Conscious Alternative)

If BEL allows flexibility on infrastructure:

| Component | Budget Option | Monthly Cost |
|-----------|--------------|-------------|
| Compute | 2x Hetzner AX52 (dedicated) | $200 |
| Database | Self-hosted PostgreSQL + TimescaleDB | $0 (on server) |
| Graph | Neo4j Community (free) | $0 |
| Queue | Redis Streams (instead of Kafka) | $0 |
| ML | Self-hosted models on GPU server | $0 |
| Hosting | Hetzner or Indian cloud (E2E Networks) | $200-400 |
| APIs | Twitter Essential ($100), rest free | $100 |
| **Budget Total** | | **$300-700/mo** |

This approach sacrifices AWS compliance but costs 95% less.

---

## 5. Summary of Cost Scenarios

| Scenario | Monthly Infra | Dev Cost (one-time) | Year 1 Total |
|----------|--------------|--------------------|--------------|
| **PoC (Current)** | $300 | $0 (AI-built) | $3,600 |
| **Budget Production** | $700 | $1,200 (AI-dev) | $9,600 |
| **Standard Production** | $5,000 | $35,000 (small team) | $95,000 |
| **BEL-Spec Production** | $15,800 | $50,000 (full team) | $239,600 |

---

## 6. Our Recommended Approach

1. **Phase 1 (Now):** PoC on Render — $300/mo — DONE
2. **Phase 2 (Post-demo):** Upgraded PoC with real APIs on budget infra — $700/mo
3. **Phase 3 (Post-contract):** Full BEL-spec AWS deployment — funded by contract

**The PoC investment ($600-1,200) is negligible compared to the contract value. It demonstrates capability at <1% of production cost.**
