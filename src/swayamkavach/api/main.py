"""SwayamKavach Core API Server."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from swayamkavach.api.routes.alerts import router as alerts_router
from swayamkavach.api.routes.health import router as health_router
from swayamkavach.api.routes.ingestion import router as ingestion_router
from swayamkavach.db.session import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("swayamkavach.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown hooks."""
    logger.info("Initializing SwayamKavach API and database schemas...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down SwayamKavach API.")


app = FastAPI(
    title="SwayamKavach Control Plane API",
    description="Adaptive, Self-Healing IoT Intrusion Detection System API",
    version="0.1.0",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api/v1
app.include_router(health_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "system": "SwayamKavach",
        "description": "Self-Healing Autonomous IoT Intrusion Detection System",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
    }
