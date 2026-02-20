# API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

### Login
`POST /auth/login`
- **Body**: `{ "email": "admin@insighthub.com", "password": "..." }`
- **Response**: `{ "access_token": "...", "user": { ... } }`

### Register
`POST /auth/register` (Admin only)
- **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "dev" }`

---

## Systems

### List Systems
`GET /systems`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `[ { "id": "...", "name": "CRMMenu", ... } ]`

### Create System
`POST /systems`
- **Body**:
  ```json
  {
    "name": "New System",
    "base_url": "https://api.example.com",
    "auth_type": "bearer",
    "auth_config": { "token": "..." }
  }
  ```

---

## Endpoints

### List endpoints by System
`GET /endpoints/system/:systemId`

### Create Endpoint
`POST /endpoints`
- **Body**:
  ```json
  {
    "system_id": "...",
    "name": "Get Users",
    "url_template": "/users/:id",
    "method": "GET"
  }
  ```

### Test Endpoint
`POST /endpoints/:id/test`
- **Body**: `{ "params": { "id": 123 } }`
- **Response**: `{ "status": 200, "data": { ... } }`

---

## Data Collector

### Collect from Endpoint
`POST /collector/collect/:endpointId`
- **Body**: `{ "params": { "year": 2026 } }`

---

## AI Engine

### Generate Insight
`POST /insights/generate`
- **Body**:
  ```json
  {
    "type": "analysis",
    "endpoint_id": "...",
    "params": { ... }
  }
  ```

### Chat
`POST /insights/chat`
- **Body**:
  ```json
  {
    "system_id": "...",
    "question": "What is the trend for active users?"
  }
  ```

---

## Dashboard

### Summary
`GET /dashboard/summary`
- **Response**: `{ "total_systems": 5, "total_insights": 12, ... }`

### Health
`GET /dashboard/health`
- **Response**: `{ "ollama_status": "online", "db_status": "connected" }`
