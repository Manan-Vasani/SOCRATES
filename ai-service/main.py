from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import tutor, recommendation, summarizer

app = FastAPI(
    title="SOCRATES AI Microservice",
    description="High-performance Python AI/ML microservice for tutoring, vector recommendations, and session summarization.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount AI Routers
app.include_router(tutor.router)
app.include_router(recommendation.router)
app.include_router(summarizer.router)

@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    Health check endpoint for container / server monitoring.
    """
    return {
        "status": "online",
        "service": "SOCRATES AI Microservice",
        "framework": "FastAPI",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
