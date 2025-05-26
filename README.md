# 🧠 Agentic Data Warehouse Assistant

This project is an AI-powered FastAPI + Next.js tool for exploring, analyzing, and tracking lineage of stored procedures and table relationships in a modern data warehouse (Bronze, Silver, Gold).

It supports:
- Schema and procedure exploration
- AI-assisted stored procedure analysis using Azure OpenAI
- Data lineage extraction and storage in SQL Server
- Manual source-to-stage mapping
- Bulk lineage extraction by schema
- Trusted connection or username/password support
- Dockerized for local development

---

## 📁 Project Structure

```bash
.
├── backend/               # FastAPI app (Python)
│   ├── api/               # API routes (procedures, lineage, etc.)
│   ├── models/            # Pydantic models
│   ├── utils/             # Azure OpenAI + hashing
│   ├── connections/       # Connection manager & config
│   ├── main.py            # App entrypoint
│   └── ...
├── frontend/              # Next.js app (React + TailwindCSS)
│   ├── pages/             # Pages (/, /lineage, /source-map)
│   ├── components/        # Shared components
│   └── ...
├── connections/
│   └── connections.json   # Connection definitions (no secrets)
├── .env                   # Local secrets (excluded from Git)
├── .env.example           # Template for your environment variables
├── .gitignore             # Git ignore file
├── docker-compose.yml     # Full app stack (backend + frontend)
└── README.md              # This file