from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import schema, procedures, analyze, analyze_status, lineage, lineage_bulk, source_stage, source_stage_map


app = FastAPI()

# ✅ Add CORS middleware before any routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔐 Replace "*" with allowed domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Then include routers
app.include_router(schema.router)
app.include_router(procedures.router)
app.include_router(analyze.router)
app.include_router(analyze_status.router)
app.include_router(lineage.router)
app.include_router(lineage_bulk.router)
app.include_router(source_stage.router)
app.include_router(source_stage_map.router)