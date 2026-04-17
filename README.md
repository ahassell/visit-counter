# Visit Counter

A minimal full-stack demo that tracks page visits (and button clicks) using **Next.js**, **Redis**, and **Docker** — deployed to a **Vultr** virtual machine.

Built as a hands-on introduction to containerizing a stateful web application and shipping it to a cloud VM.

---

## Architecture

```
Browser
  │
  ▼
Next.js App (port 80)
  │  App Router — React client component
  │  API Route: POST /api/count
  │
  ▼
Redis (internal Docker network)
  └─ key: "visit:count"
       INCR on every visit or button click
```

Two Docker containers share a private network (`docker-compose` default bridge). The Next.js app is the only container exposed to the internet. Redis is never publicly accessible.

The counter is stored as a single Redis string key (`visit:count`) and incremented atomically with `INCR` — no race conditions, no database schema.

---

## Run Locally

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/visit-counter.git
cd visit-counter

# 2. Start both containers
docker compose up --build

# 3. Open http://localhost in your browser
```

The counter increments automatically on page load and again each time you click the button. Stop the containers with `Ctrl+C`. The count persists between restarts thanks to the named Docker volume (`redis_data`).

**Without Docker** (requires Node.js 20+ and a local Redis instance):

```bash
npm install
cp .env.example .env   # adjust REDIS_HOST/PORT if needed
npm run dev            # http://localhost:3000
```

---

## Deploy to Vultr

### 1. Provision a VM

1. Log in to [vultr.com](https://www.vultr.com) and click **Deploy**.
2. Choose **Cloud Compute — Shared CPU**.
3. Select a region close to you.
4. Select **Ubuntu 24.04 LTS** as the image.
5. Pick the **$6/month** plan (1 vCPU, 1 GB RAM — plenty for this app).
6. Add your SSH key (recommended) or use the root password emailed to you.
7. Click **Deploy Now** and wait ~60 seconds for the VM to boot.

### 2. Install Docker on the VM

SSH into your new server:

```bash
ssh root@<your-vm-ip>
```

Install Docker Engine and the Compose plugin:

```bash
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Verify:

```bash
docker --version && docker compose version
```

### 3. Deploy the App

Still on the VM, clone your repo and start the stack:

```bash
git clone https://github.com/<your-username>/visit-counter.git
cd visit-counter
docker compose up -d --build
```

The `-d` flag runs the containers in the background. The build takes ~2 minutes on first run.

### 4. Open the Firewall

By default Vultr blocks inbound traffic. Allow HTTP in the Vultr dashboard:

**Vultr Dashboard → your VM → Settings → Firewall → Add rule:**

| Protocol | Port | Source |
|----------|------|--------|
| TCP | 80 | 0.0.0.0/0 |

Or from the VM itself:

```bash
ufw allow 80/tcp
ufw enable
```

### 5. Visit the App

Open `http://<your-vm-ip>` in your browser. The counter is live.

---

## Project Structure

```
visit-counter/
├── app/
│   ├── page.tsx          # Client component — counter UI
│   ├── layout.tsx
│   └── api/
│       └── count/
│           └── route.ts  # API route — GET/POST to Redis
├── lib/
│   └── redis.ts          # ioredis singleton (respects REDIS_HOST env var)
├── Dockerfile            # Multi-stage build → minimal production image
├── docker-compose.yml    # Orchestrates app + Redis containers
├── .env.example
└── next.config.ts
```

---

## Key Design Decisions

- **`INCR` over `GET`/`SET`**: Redis's atomic `INCR` command handles concurrent requests correctly without any locking logic.
- **Multi-stage Dockerfile**: Keeps the final image small by discarding build tools and using Next.js's `standalone` output mode.
- **Named volume for Redis**: `redis_data` persists the count across `docker compose down` / `up` cycles.
- **`depends_on` with healthcheck**: The app container waits for Redis to pass a `redis-cli ping` check before starting, preventing connection errors on cold boot.
