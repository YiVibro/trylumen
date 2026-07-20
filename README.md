# TryLumen

**A production-ready RAG platform that lets you upload documents and actually chat with them  built to run smoothly even on cheap cloud hardware.**

TryLumen is a multi-tenant Document Intelligence system. Upload PDFs, Word docs, images, or text files, and it turns them into a searchable knowledge base you can query in plain English — with real answers backed by citations, not hallucinations.

---

## How It's Built

The whole system is split into small, focused pieces instead of one giant server. That's what lets it run comfortably on something as small as an AWS EC2 t2.micro (1GB RAM) without falling over.

![image]("image url")
Why it's set up this way:
- **Frontend** — a dashboard to manage your files, plus a chat window that shows live progress while a document is being processed (via websockets).
- **Nginx** — sits in front of everything, routes traffic, and serves static assets.
- **backend-api** — handles login/auth (JWT), talks to Supabase, and hands off heavy lifting to a background queue instead of doing it inline.
- **backend-worker** — a separate container that actually does the slow work (parsing, embedding, etc.), capped at 1 job at a time so it doesn't choke a low-RAM box.
- **Upstash Redis** — a serverless Redis instance that connects the API and the worker without either of them needing to know about the other directly.

The neat part: `backend-api` and `backend-worker` are literally the same Docker image. Docker Compose just starts two containers from it with different start commands. One image, two roles — less to build, less to maintain.

---

## The Upload Pipeline, Step by Step

Getting a file from "selected on your computer" to "ready to chat with" goes through a few deliberate safety checks:

1. **Ask for permission to upload** — the frontend asks the backend for a temporary, scoped upload link.
2. **Presigned URL with limits baked in** — the backend generates an S3 Presigned Post (via `@aws-sdk/s3-presigned-post`) that only accepts files between 0 bytes and 50MB. S3 rejects anything outside that range before it even reaches your app — no wasted bandwidth on bad uploads.
3. **Direct-to-S3 upload** — the file goes straight from the browser to a private S3 bucket. It never passes through your server, which keeps things fast and light.
4. **Real file-type check** — once the upload finishes, the backend doesn't trust the file extension. It pulls just the first 16 bytes of the file from S3 (using an HTTP range request) and checks the magic bytes to confirm what the file actually is. This stops someone from sneaking a malicious file in by renaming it to `.pdf`.
5. **Queue it and move on** — a small job (`{ documentId, s3Key, detectedType, userId }`) gets pushed to Redis, and the API responds immediately. No waiting around, no timeouts.
6. **The worker does the heavy lifting** — it picks up the job, streams the full file from S3 straight into memory (nothing ever touches the disk), and extracts the text depending on file type: PDFs, Word docs (via Mammoth), plain text/markdown, and even OCR for images (Tesseract.js). Then it chunks the text, generates embeddings with Gemini, and saves the vectors into Supabase (pgvector). Once done, the document status flips to `ready`.

---

## Asking Questions & Deleting Files

**Query flow:** your question gets turned into a 768-dimension embedding via Gemini, matched against stored chunks using a custom Postgres function (`hybrid_search`) over pgvector, and the most relevant chunks are handed to Gemini 1.5 Flash with tight instructions to stick to the facts. You get back an answer plus the sources it came from.

**Multi-tenant safety:** every user only ever sees their own data. This isn't just an app-level check — it's enforced at the database level with Supabase Row Level Security, so even a bug in the app code can't leak someone else's documents.

**Deleting a document:** removes the file from S3 first, then drops the row in Supabase. A Postgres cascade constraint automatically cleans up every related chunk/vector — no orphaned data left lying around.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React, Vite, Tailwind CSS, Socket.io |
| API Gateway | Express.js, JWT |
| Message Broker | Upstash Redis + BullMQ |
| File Storage | AWS S3 (presigned uploads) |
| Vector Compute | Supabase (Postgres + pgvector) |
| AI / Embeddings | Google Gemini |
| Reverse Proxy | Nginx |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# --- Server ---
NODE_ENV=production
PORT=5000
JWT_SECRET=your_jwt_secret

# --- AWS S3 ---
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name

# --- Supabase ---
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# --- Upstash Redis ---
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# --- Gemini ---
GEMINI_API_KEY=your_gemini_api_key
```

---

## Running It Locally

```bash
# 1. Clone the repo
git clone https://github.com/YiVibro/trylumen.git
cd trylumen

# 2. Add your .env file (see above)

# 3. Build and start everything
docker-compose up --build
```

That's it — Docker Compose spins up the frontend, Nginx, `backend-api`, and `backend-worker` together.

---

