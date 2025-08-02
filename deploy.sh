#!/bin/bash

# Telegram Catalog Deploy Script
# This script helps deploy the application to a VPS

echo "🚀 Starting Telegram Catalog deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Create systemd service file
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/telegram-catalog.service > /dev/null <<EOF
[Unit]
Description=Telegram Catalog
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
echo "🔄 Reloading systemd and enabling service..."
sudo systemctl daemon-reload
sudo systemctl enable telegram-catalog
sudo systemctl start telegram-catalog

# Check service status
echo "📊 Checking service status..."
sudo systemctl status telegram-catalog --no-pager

echo "✅ Deployment completed!"
echo ""
echo "🌐 Your application should be running on: http://your-server-ip:3000"
echo "🔐 Admin panel: http://your-server-ip:3000/admin"
echo "👤 Default admin credentials: admin / admin123"
echo ""
echo "📝 Useful commands:"
echo "  sudo systemctl status telegram-catalog  # Check service status"
echo "  sudo systemctl restart telegram-catalog # Restart service"
echo "  sudo systemctl stop telegram-catalog    # Stop service"
echo "  sudo journalctl -u telegram-catalog -f  # View logs"
echo ""
echo "🔒 Don't forget to:"
echo "  1. Change default admin password"
echo "  2. Set up a reverse proxy (nginx) for HTTPS"
echo "  3. Configure firewall rules"
echo "  4. Set up SSL certificate" 