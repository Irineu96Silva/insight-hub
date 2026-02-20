# Deployment Guide

## Production Environment Setup

This guide assumes a Linux server (Ubuntu 22.04 LTS) with Docker and Docker Compose installed.

### 1. Server Prerequisites

Install Docker & Docker Compose:
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable --now docker
```

### 2. AI Server (Ollama)

For production, it is recommended to run Ollama on a dedicated GPU instance or ensuring your server has sufficient CPU/RAM.

1. **Install Ollama**:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
2. **Pull Model**:
   ```bash
   ollama pull llama3.1
   ```
3. **Configure Access**:
   Ensure Ollama listens on an accessible IP/Port (default 11434). You may need to edit `/etc/systemd/system/ollama.service` to set `OLLAMA_HOST` if running containers that need to access host network.

### 3. Application Deployment

1. **Clone Repo**:
   ```bash
   git clone https://github.com/your-repo/insighthub.git /opt/insighthub
   cd /opt/insighthub
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   **Important Settings:**
   - `NODE_ENV=production`
   - `DB_PASSWORD`: Set a strong password
   - `JWT_SECRET`: Generate a long random string
   - `OLLAMA_BASE_URL`: `http://172.17.0.1:11434` (Docker host IP) or external IP
   - `VITE_API_URL`: Your domain e.g., `https://api.insighthub.com`

3. **Deploy with Docker**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### 4. Reverse Proxy (Nginx)

Set up Nginx to serve the frontend and proxy API requests.

```nginx
server {
    listen 80;
    server_name insighthub.com;

    location / {
        proxy_pass http://localhost:8080;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

### 5. Maintenance

- **Logs**: `docker-compose logs -f`
- **Updates**: `git pull && docker-compose build && docker-compose up -d`
- **Backups**: Periodically backup the `pgdata` volume.
