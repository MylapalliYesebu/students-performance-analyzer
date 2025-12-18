from fastapi.testclient import TestClient
from backend.main import app
from backend import models, auth, schemas
from backend.database import Base, engine, SessionLocal
import pytest

client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_student_flow(test_db):
    # Authenticate as student (seeded in seed.py)
    response = client.post("/token", data={"username": "206F1A0501", "password": "student123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get Marks
    res = client.get("/student/marks", headers=headers)
    assert res.status_code == 200
    
    # 2. Get Analysis
    res = client.get("/student/analysis", headers=headers)
    assert res.status_code == 200
    analysis = res.json()
    assert "average_percentage" in analysis
    assert "weak_subjects" in analysis
    assert "overall_trend" in analysis

    print("Student flow test passed!")
