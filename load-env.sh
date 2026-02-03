#!/bin/bash

# Helper script to load environment variables from .env.local
# Usage: source load-env.sh

if [ -f .env.local ]; then
  echo "📝 Loading environment variables from .env.local..."
  export $(grep -v '^#' .env.local | xargs)
  echo "✅ Environment variables loaded"
  echo ""
  echo "Current AI_BUILDER_TOKEN (first 20 chars): ${AI_BUILDER_TOKEN:0:20}..."
else
  echo "⚠️  .env.local file not found"
  echo ""
  echo "Please create .env.local with:"
  echo "  AI_BUILDER_TOKEN=your_token_here"
  echo ""
  echo "Or copy from .env.example:"
  echo "  cp .env.example .env.local"
  echo "  # Then edit .env.local with your actual token"
fi
