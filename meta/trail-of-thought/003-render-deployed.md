# Render Deployment Log

**Date:** 2026-03-31

## Services Created

### PostgreSQL Database
- **Name:** iph-db
- **Service ID:** dpg-d75qkluslomc73e09t2g-a
- **Region:** Singapore
- **Plan:** Free (256MB, expires April 30, 2026)
- **Internal URL:** postgresql://iph_db_user:ybYZ85ZlWw9p0486vH7v0vlrRHX3rdk3@dpg-d75qkluslomc73e09t2g-a/iph_db

### Backend Web Service
- **Name:** iph-backend
- **Service ID:** srv-d75rodbuibrs73btgve0
- **Deploy ID:** dep-d75rodruibrs73btgvm0
- **URL:** https://iph-backend-peix.onrender.com
- **Region:** Singapore
- **Plan:** Free
- **Created via:** Render REST API (bypassed GitHub App permission issue)
- **Repo:** Public git URL (https://github.com/harshashinigami/iph-osint.git)
- **Root Dir:** backend
- **Build:** pip install -r requirements.txt
- **Start:** uvicorn app.main:app --host 0.0.0.0 --port $PORT

### Environment Variables Set
- DATABASE_URL: postgresql+asyncpg://... (internal Render DB URL)
- JWT_SECRET: iph-osint-prod-2026-secure
- DEMO_MODE: true
- TELEGRAM_BOT_TOKEN: 7703810812:AAH...

### Frontend (pending)
- Will be created as Static Site after frontend is verified locally
- Will point to backend URL: https://iph-backend-peix.onrender.com

## API Keys Used
- Render API: rnd_S4f1... (stored locally, not committed)
- GitHub token: ghp_RLi... (admin:repo_hook scope)
