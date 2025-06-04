#!/bin/bash

# Create necessary directories
mkdir -p backend/uploads

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "Please update the .env file with your configuration"
fi

# Initialize database
echo "Initializing database..."
node scripts/init-db.js

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../client
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "VITE_API_URL=http://localhost:5000/api" > .env
  echo "VITE_FRONTEND_URL=http://localhost:5173" >> .env
fi

echo "Development environment setup complete!"
echo "To start the backend: cd backend && npm run dev"
echo "To start the frontend: cd client && npm run dev"
echo ""
echo "Test accounts:"
echo "Admin: admin@evangadi.com / admin123"
echo "Employee: john@example.com / employee123" 