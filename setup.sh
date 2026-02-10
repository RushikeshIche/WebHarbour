#!/bin/bash

# WebHarbour Quick Start Script

echo "====================================="
echo "   WebHarbour - Quick Start Guide"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Backend setup
echo "🚀 Setting up Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "📝 Backend setup complete!"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found in backend folder!"
    echo ""
    echo "Please create a .env file with the following content:"
    echo ""
    echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webharbour"
    echo "JWT_SECRET=webharbour-secret-key"
    echo "PORT=5000"
    echo "NODE_ENV=development"
    echo ""
    echo "Then run: npm start"
else
    echo "✅ .env file found"
fi

echo ""
echo "====================================="
echo "   Setup Complete! 🎉"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Configure your .env file with MongoDB URI"
echo "2. Run 'npm start' in the backend folder to start the server"
echo "3. Open frontend/index.html in your browser (use Live Server extension)"
echo ""
echo "For detailed setup instructions, see SETUP_GUIDE.md"
echo ""
