#!/bin/bash
# dev.sh

# Remember to export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
export AWS_REGION=eu-west-2
export NODE_ENV=development

# Install dependencies if needed
echo "Installing backend dependencies..."
cd backend && npm install
cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Start backend
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd frontend
export REACT_APP_BACKEND_URL=http://localhost:5001
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
