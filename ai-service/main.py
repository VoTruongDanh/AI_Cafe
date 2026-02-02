"""
AI Service - FastAPI Application
Main entry point for the AI service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import face
try:
    from api.routers import temperature
except ImportError as e:
    print(f"[WARN] Could not import temperature router (likely missing sklearn): {e}")
    temperature = None

from ai_service.face_recognition import init_arcface_v2_system

# Create FastAPI app
app = FastAPI(
    title="AI Service",
    description="AI Service for Temperature Classification and Face Recognition",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
if temperature:
    app.include_router(temperature.router)
app.include_router(face.router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("[INFO] Starting AI Service...")
    print("[INFO] Initializing ArcFace V2 System...")
    try:
        if init_arcface_v2_system():
            print("[INFO] [OK] ArcFace V2 System Initialized Successfully")
        else:
            print("[ERROR] ArcFace V2 System Initialization FAILED")
    except Exception as e:
        print(f"[ERROR] Startup init failed: {e}")
        import traceback
        traceback.print_exc()


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "AI Service - Temperature Classification + Face Recognition",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "temperature": [
                "/temperature/",
                "/temperature/stats",
                "/temperature/collect",
                "/temperature/predict",
                "/temperature/reload-model"
            ],
            "face": [
                "/face/status",
                "/face/v2/status",
                "/face/v2/cache-customers",
                "/face/v2/recognize"
            ]
        }
    }


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9009, reload=True)
