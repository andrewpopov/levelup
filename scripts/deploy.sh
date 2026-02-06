#!/bin/bash
set -e

echo "================================"
echo "Deploying Level Up Journal"
echo "================================"

# Navigate to project directory
cd /home/admin/proj/levelup

echo "1. Pulling latest code from GitHub..."
git pull origin master

echo "2. Installing backend dependencies..."
cd backend
npm ci --omit=dev
cd ..

echo "3. Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "4. Building frontend..."
cd frontend
npm run build
cd ..

echo "5. Setting up backend environment..."
if [ ! -f backend/.env ]; then
    echo "Warning: backend/.env not found. Please create it manually."
else
    echo "backend/.env exists."
fi

echo "6. Creating logs directory..."
mkdir -p logs

echo "7. Restarting PM2 services..."
pm2 restart levelup-app || pm2 start ecosystem.config.js --only levelup-app
pm2 restart levelup-tunnel || pm2 start ecosystem.config.js --only levelup-tunnel

echo "8. Saving PM2 config..."
pm2 save

echo "9. Checking PM2 status..."
pm2 status

echo "================================"
echo "Deployment complete!"
echo "================================"
echo ""
echo "Check logs with:"
echo "  pm2 logs levelup-app"
echo "  pm2 logs levelup-tunnel"
