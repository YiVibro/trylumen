# InsightStream 🧠

A production-ready RAG (Retrieval-Augmented Generation) powered document intelligence platform.

## Features
- 📄 Upload PDF documents and ask questions about them
- 🔍 Semantic search using vector embeddings (pgvector)
- 💬 AI-generated answers with inline citations
- ⚡ Real-time embedding progress via WebSockets
- 🔐 JWT authentication with Role-Based Access Control
- 🐳 Fully containerized with Docker
- 🚀 CI/CD with GitHub Actions → AWS EC2

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI | Google Gemini (embeddings + generation) |
| Vector DB | Supabase pgvector |
| Real-time | Socket.io |
| Reverse Proxy | Nginx |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2 |

## Local Setup

### Prerequisites
- Node.js 18+
- Docker Desktop
- Supabase account
- Google AI Studio account (free)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Architecture
User → Nginx → React (static)
→ Node.js API → Supabase (pgvector)
→ Gemini API
→ Socket.io (real-time progress)

## Deployment
Deployed on AWS EC2 with Docker Compose.
CI/CD via GitHub Actions on push to `main`.