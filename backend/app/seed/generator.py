"""
Synthetic data generator for ILA OSINT PoC.
Generates realistic Indian OSINT data: posts, entities, relationships, alerts.
"""
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Source, RawPost, ProcessedPost, Entity, EntityRelation, EntityPostMention, Keyword, Alert, AlertRule

fake = Faker("en_IN")
Faker.seed(42)
random.seed(42)

# ── Indian OSINT Scenario Data ─────────────────────────

PLATFORMS = ["twitter", "telegram", "reddit", "rss", "facebook", "instagram", "youtube", "darkweb"]

INDIAN_CITIES = [
    {"name": "Delhi", "lat": 28.6139, "lon": 77.2090, "state": "Delhi"},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "state": "Maharashtra"},
    {"name": "Bangalore", "lat": 12.9716, "lon": 77.5946, "state": "Karnataka"},
    {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867, "state": "Telangana"},
    {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "state": "Tamil Nadu"},
    {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639, "state": "West Bengal"},
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "state": "Maharashtra"},
    {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "state": "Gujarat"},
    {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873, "state": "Rajasthan"},
    {"name": "Lucknow", "lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh"},
    {"name": "Srinagar", "lat": 34.0837, "lon": 74.7973, "state": "J&K"},
    {"name": "Guwahati", "lat": 26.1445, "lon": 91.7362, "state": "Assam"},
    {"name": "Patna", "lat": 25.6093, "lon": 85.1376, "state": "Bihar"},
    {"name": "Bhopal", "lat": 23.2599, "lon": 77.4126, "state": "Madhya Pradesh"},
    {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "state": "Chandigarh"},
]

INDIAN_NAMES = [
    "Rajesh Kumar", "Priya Sharma", "Vikram Singh", "Anita Devi", "Suresh Patel",
    "Meena Gupta", "Arjun Reddy", "Deepa Nair", "Mohammad Iqbal", "Fatima Begum",
    "Rahul Verma", "Sunita Yadav", "Amit Joshi", "Kavita Mishra", "Sanjay Tiwari",
    "Lakshmi Iyer", "Ravi Shankar", "Pooja Agarwal", "Harish Chandra", "Neha Kapoor",
    "Abdul Rahman", "Geeta Rao", "Manoj Pandey", "Sarita Chauhan", "Vivek Saxena",
    "Rekha Pillai", "Ashok Mehta", "Kamala Devi", "Prakash Jha", "Divya Menon",
]

ORGANIZATIONS = [
    "Bharat Cyber Front", "Digital India Trust", "South Asia Policy Forum",
    "National Security Analytics", "Indian Blockchain Council", "People's Digital Rights",
    "Cyber Crime Investigation Bureau", "Strategic Defence Institute",
    "Financial Intelligence Unit", "Terror Watch Network",
    "Social Media Research Lab", "Counter Narrative Foundation",
    "Hindutva Digital Army", "Kashmir Freedom Front", "Red Alert Network",
]

PHONE_NUMBERS = [f"+91{random.randint(7000000000, 9999999999)}" for _ in range(20)]
UPI_IDS = [
    "rajesh.kumar@paytm", "fraud.alert@upi", "quick.money@ybl", "lucky.prize@okhdfcbank",
    "invest.now@okaxis", "cash.back@oksbi", "payment.done@gpay", "transfer.fast@paytm",
    "secure.pay@upi", "winner.2024@ybl", "claim.prize@gpay", "account.verify@paytm",
]
CRYPTO_WALLETS = [
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
    "TKzLaX3vYbQmP7r2nEiYxcF8j5pXqLdBzR",
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
]
IP_ADDRESSES = [f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}" for _ in range(15)]
DOMAINS = [
    "sbi-bank-login.com", "paytm-verify.in", "govt-subsidy-claim.org",
    "free-recharge-offer.com", "aadhaar-update-portal.in", "pm-kisan-check.com",
    "crypto-invest-india.com", "telegram-verify.org", "whatsapp-verify.com",
    "upi-refund-claim.in",
]

THREAT_KEYWORDS = [
    "bomb threat", "attack planned", "jihad", "separatist movement", "arms smuggling",
    "terror cell", "radicalization", "sleeper cell", "cross-border infiltration",
    "IED found", "stone pelting", "communal violence", "hate speech", "mob lynching",
]

FRAUD_KEYWORDS = [
    "UPI fraud", "mule account", "lottery scam", "investment scheme", "crypto pump",
    "phishing link", "fake KYC", "OTP fraud", "card cloning", "money laundering",
]

PROPAGANDA_TEMPLATES = [
    "BREAKING: Government sources confirm {event} in {city}. Officials refuse to comment. Share before they delete! #Truth",
    "Why is mainstream media silent about {event}? Follow @{handle} for real updates from {city}. RT to spread awareness!",
    "ALERT: {org} has confirmed massive {event} near {city}. Citizens are advised to stay alert. Share with your contacts!",
    "{person} exposed! Secret links to {org} revealed. Documents show {event}. Media won't cover this. #Exposed #Truth",
    "Shocking report from {city}: {event}. {org} involved? Inside sources say yes. MSM silent as usual. #WakeUp",
]

NEWS_TEMPLATES = [
    "New Delhi: The Ministry of Home Affairs today announced enhanced security measures following reports of {event} in {city}.",
    "{city}: Police arrested three suspects linked to {org} in connection with alleged {event}, officials said on Monday.",
    "Intelligence agencies have flagged increased activity of {org} operatives in {city} region, sources told our bureau.",
    "Financial regulators issued an advisory warning citizens about {event} targeting {city}-based UPI users.",
    "Cyber security experts warn of new {event} campaign targeting Indian users. {org} suspected behind the operation.",
]

FRAUD_TEMPLATES = [
    "Send Rs 500 to {upi} and get Rs 5000 back within 24 hours. Government approved scheme! Act fast, limited time offer.",
    "Your account {upi} has been selected for cashback of Rs 10,000. Verify by sending Rs 100 to {upi}. Valid till midnight.",
    "URGENT: Your bank account linked to {phone} will be suspended. Send Rs 200 to {upi} to verify. Official UPI verification process.",
    "Crypto investment opportunity! Transfer USDT to {crypto} and earn 3x returns in 48 hours. Guaranteed by {org}.",
    "WARNING: Suspicious login from IP {ip} on your {domain}. Click this link to secure your account immediately.",
]

EVENTS = [
    "data breach", "cyber attack", "financial fraud ring", "propaganda campaign",
    "terrorist plot", "arms cache discovery", "cross-border drone sighting",
    "communal tensions", "protest movement", "fake news campaign",
    "UPI fraud network", "cryptocurrency scam", "impersonation attack",
    "espionage ring", "radicalization operation",
]

TOPICS = [
    "cybersecurity", "terrorism", "financial_fraud", "propaganda", "geopolitics",
    "defence", "cryptocurrency", "elections", "communal", "border_security",
    "drug_trafficking", "human_trafficking", "money_laundering", "espionage",
    "misinformation", "hate_speech", "social_unrest", "economic_crisis",
]

SENTIMENT_LABELS = ["very_negative", "negative", "neutral", "positive", "very_positive"]
SEVERITY_LEVELS = ["critical", "high", "medium", "low", "info"]
ALERT_TYPES = ["spike", "threat", "entity", "keyword", "anomaly", "fraud", "coordination"]


def _gen_post_content():
    """Generate realistic OSINT post content."""
    template_type = random.choice(["propaganda", "news", "fraud", "organic"])
    city = random.choice(INDIAN_CITIES)
    person = random.choice(INDIAN_NAMES)
    org = random.choice(ORGANIZATIONS)
    event = random.choice(EVENTS)
    phone = random.choice(PHONE_NUMBERS)
    upi = random.choice(UPI_IDS)
    crypto = random.choice(CRYPTO_WALLETS)
    ip = random.choice(IP_ADDRESSES)
    domain = random.choice(DOMAINS)
    handle = fake.user_name()

    if template_type == "propaganda":
        content = random.choice(PROPAGANDA_TEMPLATES).format(
            event=event, city=city["name"], person=person, org=org, handle=handle
        )
    elif template_type == "news":
        content = random.choice(NEWS_TEMPLATES).format(
            event=event, city=city["name"], person=person, org=org
        )
    elif template_type == "fraud":
        content = random.choice(FRAUD_TEMPLATES).format(
            upi=upi, phone=phone, crypto=crypto, ip=ip, domain=domain, org=org
        )
    else:
        content = fake.paragraph(nb_sentences=random.randint(2, 5))
        # Sprinkle in some entities
        if random.random() > 0.6:
            content += f" Contact: {phone}"
        if random.random() > 0.7:
            content += f" UPI: {upi}"
        if random.random() > 0.8:
            content += f" Visit: {domain}"

    return content, city, template_type


def _gen_timestamp(days_back=30):
    """Generate timestamp with a spike 2-3 days ago."""
    now = datetime.utcnow()
    if random.random() > 0.85:
        # Spike: cluster posts 2-3 days ago
        return now - timedelta(days=random.uniform(2, 3), hours=random.uniform(0, 24))
    return now - timedelta(days=random.uniform(0, days_back), hours=random.uniform(0, 24))


def _gen_sentiment(template_type):
    if template_type == "fraud":
        return random.choice([-0.8, -0.6, -0.9, -0.7]), "negative"
    elif template_type == "propaganda":
        return random.choice([-0.5, -0.7, -0.3, -0.9, 0.2]), random.choice(["negative", "very_negative", "neutral"])
    elif template_type == "news":
        return random.choice([-0.2, 0.0, 0.1, -0.3, 0.2]), random.choice(["neutral", "negative", "positive"])
    else:
        score = random.uniform(-0.5, 0.5)
        label = "positive" if score > 0.2 else ("negative" if score < -0.2 else "neutral")
        return round(score, 3), label


def _gen_threat_score(template_type, content):
    base = {"fraud": 0.75, "propaganda": 0.6, "news": 0.3, "organic": 0.1}[template_type]
    # Boost for specific keywords
    for kw in THREAT_KEYWORDS + FRAUD_KEYWORDS:
        if kw.lower() in content.lower():
            base = min(base + 0.15, 1.0)
    return round(base + random.uniform(-0.1, 0.1), 3)


async def generate_all(db: AsyncSession) -> dict:
    """Generate complete synthetic dataset."""
    print("[SEED] Starting data generation...")

    # ── Sources ──────────────────────────────────────
    sources = []
    source_configs = [
        ("RSS - NDTV", "rss", {"feed_url": "https://feeds.feedburner.com/ndtvnews-top-stories"}),
        ("RSS - The Hindu", "rss", {"feed_url": "https://www.thehindu.com/feeder/default.rss"}),
        ("RSS - Times of India", "rss", {"feed_url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"}),
        ("RSS - India Today", "rss", {"feed_url": "https://www.indiatoday.in/rss/home"}),
        ("Telegram - OSINT India", "telegram", {"channel": "osint_india_updates"}),
        ("Telegram - Cyber Alerts", "telegram", {"channel": "cyber_alerts_india"}),
        ("Reddit - r/india", "reddit", {"subreddit": "india"}),
        ("Reddit - r/IndiaSpeaks", "reddit", {"subreddit": "IndiaSpeaks"}),
        ("GDELT - India Events", "gdelt", {"filter": "india"}),
        ("Twitter - OSINT Feed", "twitter", {"keywords": ["india", "security", "threat"]}),
        ("Dark Web Monitor", "darkweb", {"onion_sites": 5}),
        ("Facebook - Public Pages", "facebook", {"pages": ["news", "politics"]}),
        ("YouTube - News Channels", "youtube", {"channels": ["ndtv", "republic"]}),
        ("Instagram - OSINT", "instagram", {"hashtags": ["breaking", "india"]}),
    ]
    for name, platform, config in source_configs:
        s = Source(name=name, platform=platform, config=config, is_active=True,
                   status="idle", post_count=random.randint(100, 2000),
                   last_fetched_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 120)))
        sources.append(s)
        db.add(s)
    await db.flush()
    print(f"[SEED] Created {len(sources)} sources")

    # ── Entities (pre-generate for linking) ──────────
    entities = []
    entity_map = {}

    def add_entity(etype, value, display_name=None, risk=None):
        e = Entity(
            entity_type=etype, value=value,
            display_name=display_name or value,
            mention_count=random.randint(1, 50),
            risk_score=risk if risk is not None else round(random.uniform(0, 0.8), 2),
            extra_data={},
        )
        entities.append(e)
        db.add(e)
        entity_map[(etype, value)] = e
        return e

    # Persons
    for name in INDIAN_NAMES:
        add_entity("person", name, risk=round(random.uniform(0, 0.7), 2))
    # Organizations
    for org in ORGANIZATIONS:
        add_entity("org", org, risk=round(random.uniform(0.2, 0.9), 2))
    # Phones
    for phone in PHONE_NUMBERS:
        add_entity("phone", phone, risk=round(random.uniform(0, 0.6), 2))
    # UPIs
    for upi in UPI_IDS:
        add_entity("upi", upi, risk=round(random.uniform(0.3, 0.95), 2))
    # Crypto
    for wallet in CRYPTO_WALLETS:
        add_entity("crypto", wallet, display_name=wallet[:12]+"...", risk=round(random.uniform(0.4, 0.9), 2))
    # IPs
    for ip in IP_ADDRESSES:
        add_entity("ip", ip, risk=round(random.uniform(0, 0.7), 2))
    # Domains
    for domain in DOMAINS:
        add_entity("domain", domain, risk=round(random.uniform(0.5, 0.95), 2))
    # Locations
    for city in INDIAN_CITIES:
        add_entity("location", city["name"], risk=round(random.uniform(0, 0.4), 2))

    await db.flush()
    print(f"[SEED] Created {len(entities)} entities")

    # ── Raw Posts + Processed Posts ──────────────────
    raw_posts = []
    processed_posts = []
    post_entities = []  # (post, [entity_keys])

    for i in range(10000):
        content, city, template_type = _gen_post_content()
        platform = random.choices(
            PLATFORMS, weights=[25, 20, 15, 15, 10, 5, 5, 5], k=1
        )[0]
        source = random.choice([s for s in sources if s.platform == platform] or sources)
        ts = _gen_timestamp()

        raw = RawPost(
            source_id=source.id,
            external_id=f"{platform}_{uuid.uuid4().hex[:12]}",
            platform=platform,
            author_name=random.choice(INDIAN_NAMES) if random.random() > 0.3 else fake.user_name(),
            author_handle=f"@{fake.user_name()}",
            content=content,
            media_urls=[],
            raw_metadata={
                "likes": random.randint(0, 5000),
                "shares": random.randint(0, 1000),
                "followers": random.randint(10, 100000),
            },
            language=random.choices(["en", "hi", "ur", "ta", "bn"], weights=[70, 15, 5, 5, 5], k=1)[0],
            collected_at=ts,
            published_at=ts - timedelta(minutes=random.randint(0, 30)),
            is_processed=True,
        )
        raw_posts.append(raw)
        db.add(raw)

        if i % 2000 == 0 and i > 0:
            await db.flush()

    await db.flush()
    print(f"[SEED] Created {len(raw_posts)} raw posts")

    # Process all posts
    for i, raw in enumerate(raw_posts):
        _, city, template_type = _gen_post_content()  # re-derive for sentiment/threat
        sent_score, sent_label = _gen_sentiment(template_type)
        threat = _gen_threat_score(template_type, raw.content)
        geo_city = random.choice(INDIAN_CITIES) if random.random() > 0.4 else None
        topics = random.sample(TOPICS, k=random.randint(1, 3))
        categories = []
        if threat > 0.6:
            categories = random.sample(["propaganda", "fraud", "cyber_threat", "misinformation", "extremism"], k=random.randint(1, 2))

        proc = ProcessedPost(
            raw_post_id=raw.id,
            content_clean=raw.content,
            language=raw.language,
            sentiment_score=sent_score,
            sentiment_label=sent_label,
            threat_score=threat,
            threat_categories=categories,
            topics=topics,
            ner_results={"persons": [], "orgs": [], "locations": []},
            extracted_entities=[],
            geo_lat=geo_city["lat"] + random.uniform(-0.1, 0.1) if geo_city else None,
            geo_lon=geo_city["lon"] + random.uniform(-0.1, 0.1) if geo_city else None,
            geo_label=geo_city["name"] if geo_city else None,
            processed_at=raw.collected_at + timedelta(seconds=random.randint(1, 30)),
        )
        processed_posts.append(proc)
        db.add(proc)

        if i % 2000 == 0 and i > 0:
            await db.flush()

    await db.flush()
    print(f"[SEED] Created {len(processed_posts)} processed posts")

    # ── Entity-Post Mentions (link entities to posts) ──
    mention_count = 0
    for i, proc in enumerate(processed_posts):
        content = raw_posts[i].content
        mentioned = []
        # Check for entity mentions in content
        for (etype, value), entity in entity_map.items():
            if value in content or (etype == "person" and value.split()[0] in content):
                mentioned.append(entity)
        # Random additional mentions for density
        if random.random() > 0.7 and not mentioned:
            mentioned = random.sample(entities, k=random.randint(1, 3))

        for entity in mentioned[:5]:
            m = EntityPostMention(entity_id=entity.id, post_id=proc.id, mention_context=content[:200])
            db.add(m)
            entity.mention_count = (entity.mention_count or 0) + 1
            mention_count += 1

        if i % 2000 == 0 and i > 0:
            await db.flush()

    await db.flush()
    print(f"[SEED] Created {mention_count} entity-post mentions")

    # ── Entity Relations ─────────────────────────────
    relation_types = ["co_mentioned", "communicates_with", "affiliated", "financial_link", "same_as"]
    relation_count = 0
    seen_relations = set()  # track (source, target, type) to avoid duplicates

    def add_relation(src_id, tgt_id, rtype, w=None):
        nonlocal relation_count
        key = (str(src_id), str(tgt_id), rtype)
        if key in seen_relations or str(src_id) == str(tgt_id):
            return
        seen_relations.add(key)
        r = EntityRelation(
            source_entity_id=src_id, target_entity_id=tgt_id,
            relation_type=rtype, weight=w or round(random.uniform(0.3, 0.9), 2),
        )
        db.add(r)
        relation_count += 1

    # Create UPI fraud network (dense cluster)
    upi_entities = [e for e in entities if e.entity_type == "upi"]
    phone_entities = [e for e in entities if e.entity_type == "phone"]
    for i, upi in enumerate(upi_entities):
        if i < len(phone_entities):
            add_relation(upi.id, phone_entities[i].id, "financial_link", round(random.uniform(0.7, 1.0), 2))
        if i > 0:
            add_relation(upi_entities[i-1].id, upi.id, "financial_link", round(random.uniform(0.5, 0.9), 2))

    # Create person-org affiliations
    person_entities = [e for e in entities if e.entity_type == "person"]
    org_entities = [e for e in entities if e.entity_type == "org"]
    for person in person_entities:
        for org in random.sample(org_entities, k=random.randint(0, 2)):
            add_relation(person.id, org.id, "affiliated")

    # Random co-mention relations
    for _ in range(500):
        e1, e2 = random.sample(entities, 2)
        add_relation(e1.id, e2.id, random.choice(relation_types))

    # Crypto-IP-Domain links (cyber threat cluster)
    crypto_entities = [e for e in entities if e.entity_type == "crypto"]
    ip_entities = [e for e in entities if e.entity_type == "ip"]
    domain_entities = [e for e in entities if e.entity_type == "domain"]
    for crypto in crypto_entities:
        ip = random.choice(ip_entities)
        domain = random.choice(domain_entities)
        add_relation(crypto.id, ip.id, "communicates_with", 0.8)
        add_relation(ip.id, domain.id, "co_mentioned", 0.7)

    await db.flush()
    print(f"[SEED] Created {relation_count} entity relations")

    # ── Keywords ─────────────────────────────────────
    keyword_count = 0
    for kw in THREAT_KEYWORDS + FRAUD_KEYWORDS:
        k = Keyword(keyword=kw, category="threat" if kw in THREAT_KEYWORDS else "fraud",
                    is_active=True, match_count=random.randint(10, 500))
        db.add(k)
        keyword_count += 1
    await db.flush()
    print(f"[SEED] Created {keyword_count} keywords")

    # ── Alerts ───────────────────────────────────────
    alert_count = 0
    alert_templates = [
        ("Volume spike detected: {kw} mentions increased 300% in last 6 hours", "spike", "high"),
        ("High-risk entity detected: {entity} (risk score: {risk})", "entity", "critical"),
        ("Keyword match: '{kw}' found in {platform} post from {city}", "keyword", "medium"),
        ("Coordinated activity: {n} accounts posting similar content within 5 minutes", "coordination", "high"),
        ("Financial fraud pattern: UPI {upi} linked to {n} mule accounts", "fraud", "critical"),
        ("Anomaly detected: {platform} volume 5σ above baseline for {city}", "anomaly", "high"),
        ("Threat escalation: {kw} mentions in {city} exceed alert threshold", "threat", "critical"),
        ("New phishing domain detected: {domain} (lookalike score: 0.92)", "entity", "high"),
        ("Propaganda surge: {n} coordinated posts detected in {platform}", "coordination", "medium"),
        ("Sentiment shift: {city} shifted from neutral to negative (-0.7) in 2 hours", "anomaly", "medium"),
    ]
    for i in range(200):
        tmpl, atype, severity = random.choice(alert_templates)
        city = random.choice(INDIAN_CITIES)
        title = tmpl.format(
            kw=random.choice(THREAT_KEYWORDS + FRAUD_KEYWORDS),
            entity=random.choice(INDIAN_NAMES + ORGANIZATIONS),
            risk=round(random.uniform(0.7, 0.99), 2),
            platform=random.choice(PLATFORMS),
            city=city["name"],
            n=random.randint(5, 50),
            upi=random.choice(UPI_IDS),
            domain=random.choice(DOMAINS),
        )
        a = Alert(
            title=title,
            description=f"Automated alert generated by the ILA threat monitoring engine. Location: {city['name']}, {city['state']}.",
            severity=severity if random.random() > 0.3 else random.choice(SEVERITY_LEVELS),
            alert_type=atype,
            extra_data={"location": city["name"], "state": city["state"]},
            is_read=random.random() > 0.6,
            is_acknowledged=random.random() > 0.8,
            created_at=_gen_timestamp(days_back=14),
        )
        db.add(a)
        alert_count += 1
    await db.flush()
    print(f"[SEED] Created {alert_count} alerts")

    # ── Alert Rules ──────────────────────────────────
    rules = [
        AlertRule(name="High threat keyword match", rule_type="keyword_match",
                  config={"keywords": THREAT_KEYWORDS[:5], "threshold": 0.7}, severity="critical"),
        AlertRule(name="UPI fraud pattern", rule_type="entity_risk",
                  config={"entity_type": "upi", "risk_threshold": 0.8}, severity="critical"),
        AlertRule(name="Volume spike detection", rule_type="volume_spike",
                  config={"sigma_threshold": 2.5, "window_hours": 6}, severity="high"),
        AlertRule(name="Negative sentiment surge", rule_type="sentiment_threshold",
                  config={"threshold": -0.6, "min_posts": 20}, severity="medium"),
        AlertRule(name="Phishing domain alert", rule_type="entity_risk",
                  config={"entity_type": "domain", "risk_threshold": 0.7}, severity="high"),
    ]
    for rule in rules:
        db.add(rule)
    await db.flush()

    await db.commit()
    print("[SEED] Data generation complete!")

    return {
        "sources": len(sources),
        "raw_posts": len(raw_posts),
        "processed_posts": len(processed_posts),
        "entities": len(entities),
        "relations": relation_count,
        "mentions": mention_count,
        "keywords": keyword_count,
        "alerts": alert_count,
        "alert_rules": len(rules),
    }
