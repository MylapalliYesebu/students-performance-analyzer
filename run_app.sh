#!/bin/bash

# START BACKEND AND FRONTEND
# Run this from the project root directory

echo "========================================="
echo "ACADEMIC PERFORMANCE ANALYZER"
echo "Starting Backend and Frontend..."
echo "========================================="

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    echo "✅ Servers stopped"
}
trap cleanup EXIT

# Start Backend
echo ""
echo "🚀 Starting Backend (FastAPI)..."
source venv/bin/activate
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Check if backend is running
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend running at http://localhost:8000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start Frontend
echo ""
echo "🚀 Starting Frontend (React)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "✅ APPLICATION RUNNING!"
echo "========================================="
echo "Backend API:  http://localhost:8000"
echo "Frontend App: http://localhost:3000"
echo "API Docs:     http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo "========================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
