from fastapi.testclient import TestClient
from backend.main import app
from backend import models, auth
from backend.database import Base, engine, SessionLocal
import pytest
import csv
import io

client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_reporting_flow(test_db):
    # Authenticate as admin
    response = client.post("/token", data={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Export Report
    res = client.get("/admin/reports/export", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=student_performance_report.csv" in res.headers["content-disposition"]
    
    # Verify CSV content
    content = res.content.decode('utf-8')
    csv_reader = csv.reader(io.StringIO(content))
    header = next(csv_reader)
    
    expected_header = [
        "Student Name", "Roll Number", "Department", "Semester", 
        "Subject Code", "Subject Name", "Exam Type", "Marks Obtained", "Total Marks", "Percentage"
    ]
    assert header == expected_header
    
    # Check if there is data (seeded data)
    rows = list(csv_reader)
    assert len(rows) > 0
    first_row = rows[0]
    # Check "Student One" (from seed) is present
    assert "Student One" in first_row

    print("Reporting flow test passed!")
