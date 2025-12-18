from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth_router, admin_router, teacher_router, student_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Performance Analyzer API")

# CORS (Allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router, tags=["Authentication"])
app.include_router(admin_router.router, prefix="/admin", tags=["Admin"])
app.include_router(teacher_router.router, prefix="/teacher", tags=["Teacher"])
app.include_router(student_router.router, prefix="/student", tags=["Student"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Performance Analyzer API"}
