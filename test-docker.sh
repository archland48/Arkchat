#!/bin/bash

# Script to test Docker build for Arkchat

echo "🐳 Testing Docker build for Arkchat..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo ""
    echo "📝 To install Docker:"
    echo "   macOS: Install Docker Desktop from https://www.docker.com/products/docker-desktop"
    echo "   Linux: sudo apt-get install docker.io (or equivalent for your distro)"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo ""

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t arkchat:test .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker build successful!"
    echo ""
    echo "🧪 Testing container..."
    echo "   Starting container on port 3000..."
    
    # Run the container
    CONTAINER_ID=$(docker run -d -p 3000:3000 -e PORT=3000 arkchat:test)
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started: $CONTAINER_ID"
        echo ""
        echo "⏳ Waiting for container to be ready..."
        sleep 5
        
        # Test if the container is responding
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Container is responding!"
            echo ""
            echo "🌐 Test the app at: http://localhost:3000"
            echo ""
            echo "🛑 To stop the container, run:"
            echo "   docker stop $CONTAINER_ID"
            echo "   docker rm $CONTAINER_ID"
        else
            echo "⚠️  Container started but not responding yet"
            echo "   Check logs with: docker logs $CONTAINER_ID"
        fi
    else
        echo "❌ Failed to start container"
    fi
else
    echo "❌ Docker build failed"
    exit 1
fi
