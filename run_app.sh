#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p)
}
trap cleanup EXIT

echo "Starting Backend..."
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

echo "Application running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."

wait $BACKEND_PID $FRONTEND_PID
