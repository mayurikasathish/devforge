#!/bin/bash
# DevForge - Piston Code Execution Setup Script
# This script sets up Piston for running code in all supported languages

set -e

echo "🚀 DevForge - Setting up Piston Code Execution"
echo "==============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo ""
    echo "Please install Docker first:"
    echo "  Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  Mac: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if Piston container already exists
if docker ps -a | grep -q piston; then
    echo "⚠️  Piston container already exists"
    echo "   Stopping and removing old container..."
    docker stop piston 2>/dev/null || true
    docker rm piston 2>/dev/null || true
    echo "✅ Old container removed"
    echo ""
fi

# Pull and run Piston
echo "📦 Pulling Piston Docker image..."
docker pull ghcr.io/engineer-man/piston

echo ""
echo "⚠️  WARNING: Piston requires privileged mode for cgroup access."
echo "   This gives the container extensive system access."
echo "   Only use on trusted local development machines."
echo ""
echo "🚀 Starting Piston container..."
docker run -d \
  --name piston \
  --privileged \
  --restart unless-stopped \
  -p 2000:2000 \
  -v piston_packages:/piston/packages \
  ghcr.io/engineer-man/piston

echo ""
echo "⏳ Waiting for Piston to start..."
sleep 5

# Test if Piston is running
if curl -s http://localhost:2000/api/v2/runtimes > /dev/null; then
    echo "✅ Piston container is running!"
    echo ""
    echo "📝 NOTE: The container has NO language packages installed yet."
    echo "   Language runtimes must be installed separately (advanced)."
    echo "   For now, code execution will use local Node.js/Python fallback."
else
    echo "❌ Piston failed to start"
    echo "   Check Docker logs: docker logs piston"
    exit 1
fi

echo ""
echo "📝 Configuring backend..."

# Add PISTON_URL to backend/.env
if [ -f backend/.env ]; then
    # Remove old PISTON_URL if exists
    sed -i.bak '/PISTON_URL/d' backend/.env
fi

echo "PISTON_URL=http://localhost:2000/api/v2/piston/execute" >> backend/.env

echo "✅ Backend configuration updated"
echo ""
echo "═══════════════════════════════════════════════════"
echo "🎉 Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 Supported Languages:"
echo "   • JavaScript / TypeScript"
echo "   • Python"
echo "   • Java"
echo "   • C / C++"
echo "   • Go"
echo "   • Rust"
echo "   • Bash"
echo ""
echo "⚡ Next Steps:"
echo "   1. Restart your backend server"
echo "   2. Go to any room → Code tab"
echo "   3. Write code and click Run!"
echo ""
echo "🛠️  Useful Commands:"
echo "   View logs:    docker logs piston"
echo "   Stop Piston:  docker stop piston"
echo "   Start Piston: docker start piston"
echo "   Remove:       docker stop piston && docker rm piston"
echo ""
