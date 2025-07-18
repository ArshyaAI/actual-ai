#!/bin/bash

echo "🔨 Building Swiss Bookkeeping Agent..."

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Build backend
echo "Building backend..."
npm run build

# Install frontend dependencies  
echo "Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

cd ..

echo "✅ Build complete!"
echo "Ready to deploy to Railway!"