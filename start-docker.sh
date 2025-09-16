#!/bin/sh

# Start backend API
echo "Starting backend API..."
node server/app.cjs &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 5

# Start frontend server
echo "Starting frontend server..."
exec node serve-production.js