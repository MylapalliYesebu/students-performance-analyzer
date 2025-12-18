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

def test_teacher_flow(test_db):
    # Authenticate as teacher (seeded in seed.py)
    response = client.post("/token", data={"username": "teacher", "password": "teacher123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get Subjects
    res = client.get("/teacher/subjects", headers=headers)
    assert res.status_code == 200
    subjects = res.json()
    assert len(subjects) > 0
    subject_id = subjects[0]["id"]
    dept_id = subjects[0]["department_id"]
    sem_id = subjects[0]["semester_id"]

    # 2. Get Students
    res = client.get(f"/teacher/students/{dept_id}/{sem_id}", headers=headers)
    assert res.status_code == 200
    students = res.json()
    assert len(students) > 0
    student_id = students[0]["id"]

    # 3. Upload Marks
    marks_data = {
        "student_id": student_id,
        "subject_id": subject_id,
        "exam_type": "Mid-1",
        "marks_obtained": 85.5,
        "total_marks": 100
    }
    res = client.post("/teacher/marks", json=marks_data, headers=headers)
    assert res.status_code == 200
    assert res.json()["marks_obtained"] == 85.5

    print("Teacher flow test passed!")
