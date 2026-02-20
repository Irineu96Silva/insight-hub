# 🧠 InsightHub

InsightHub is an intelligent platform for monitoring systems, collecting data from remote endpoints, and generating actionable insights using a local AI (Ollama/Llama 3).

## 🚀 Features

- **System Management**: Register and manage external systems and their API endpoints.
- **Data Collection**: Schedule manual or automatic data collection from registered endpoints.
- **AI Insights**: Generate analysis, comparisons, anomaly detection, and forecasts using Llama 3.
- **Interactive Chat**: Converse with the AI about your system's data in real-time.
- **Dashboard**: High-level view of system health, recent insights, and collection status.
- **Modern UI**: Futuristic, dark-themed interface built with Vue 3 and Quasar.

## 🛠️ Tech Stack

- **Frontend**: Vue 3, Quasar Framework, TypeScript, Pinia, ApexCharts.
- **Backend**: NestJS, TypeORM, PostgreSQL.
- **AI Engine**: Ollama (Llama 3.1).
- **Infrastructure**: Docker Compose.

## 🏁 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- [Ollama](https://ollama.com) installed locally (for AI features)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/insighthub.git
   cd insighthub
   ```

2. **Setup Environment**:
   Copy `.env.example` to `.env` in the root directory.
   ```bash
   cp .env.example .env
   ```
   *Adjust `OLLAMA_BASE_URL` if necessary (default: `http://host.docker.internal:11434` for Windows/Mac).*

3. **Start Ollama**:
   Ensure Ollama is running and pull the Llama 3 model:
   ```bash
   ollama serve
   ollama pull llama3.1
   ```

4. **Run with Docker**:
   ```bash
   docker-compose up -d
   ```

5. **Access the Application**:
   - Frontend: [http://localhost:8080](http://localhost:8080)
   - Backend API: [http://localhost:3000](http://localhost:3000)
   - API Docs (Swagger): [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Default Credentials

- **Email**: `admin@insighthub.com`
- **Password**: `admin123`

## 📂 Project Structure

```
insighthub/
├── backend/            # NestJS API
│   ├── src/modules/    # Feature modules (Auth, Systems, AI, etc.)
│   └── ...
├── frontend/           # Quasar Vue 3 App
│   ├── src/pages/      # Application pages
│   ├── src/stores/     # Pinia State Management
│   └── ...
├── docs/               # Documentation
├── docker-compose.yml  # Container orchestration
└── ...
```

## 📖 Documentation

- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOY.md)
- [Prompts Guide](docs/PROMPTS.md)

## 📄 License

This project is licensed under the MIT License.
