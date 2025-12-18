import bcrypt
import sys
import os

# Add the project root directory to sys.path so we can import 'backend' as a package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User

# Same hashing logic as auth
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

db: Session = SessionLocal()

def create_user(username: str, password: str, role: str):
    user = User(
        username=username,
        password_hash=hash_password(password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def seed_users():
    # ---------- ADMINS ----------
    create_user("admin1", "admin123", "admin")

    # ---------- TEACHERS ----------
    for i in range(1, 16):
        create_user(
            username=f"teacher{i}",
            password="teacher123",
            role="teacher"
        )

    # ---------- STUDENTS ----------
    for i in range(1, 71):
        create_user(
            username=f"student{i}",
            password="student123",
            role="student"
        )

    print("✅ Users seeded successfully")

if __name__ == "__main__":
    seed_users()
