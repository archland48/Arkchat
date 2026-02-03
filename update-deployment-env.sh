#!/bin/bash

# Script to update deployment environment variables
# This adds AI_BUILDER_TOKEN to the deployment configuration

API_BASE_URL="https://space.ai-builders.com/backend"
API_TOKEN="${AI_BUILDER_TOKEN}"
SERVICE_NAME="arkchat"

if [ -z "$API_TOKEN" ]; then
  echo "❌ Error: AI_BUILDER_TOKEN environment variable is not set"
  echo ""
  echo "Please set it:"
  echo "  export AI_BUILDER_TOKEN=your_token_here"
  echo ""
  echo "Or load from .env.local:"
  echo "  source .env.local"
  echo "  export AI_BUILDER_TOKEN"
  exit 1
fi

echo "🔧 Updating deployment environment variables..."
echo ""
echo "Service: $SERVICE_NAME"
echo "Token (first 20 chars): ${API_TOKEN:0:20}..."
echo ""

# Try PUT method first, then POST if PUT doesn't work
# Update deployment with environment variables
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X PUT "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d "{
    \"env_vars\": {
      \"AI_BUILDER_TOKEN\": \"${API_TOKEN}\"
    }
  }" \
  --max-time 30)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

# If PUT fails, try POST
if [ "$HTTP_STATUS" = "405" ] || [ "$HTTP_STATUS" = "404" ]; then
  echo "⚠️  PUT method not supported, trying POST..."
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/env" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -d "{
      \"env_vars\": {
        \"AI_BUILDER_TOKEN\": \"${API_TOKEN}\"
      }
    }" \
    --max-time 30)
fi

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "202" ]; then
  echo "✅ Environment variables updated successfully!"
  echo ""
  echo "📝 The deployment will restart with the new environment variables."
  echo "⏳ Please wait a few minutes for the deployment to restart."
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ Authentication failed (401)"
  echo "Please check your AI_BUILDER_TOKEN"
elif [ "$HTTP_STATUS" = "404" ]; then
  echo "⚠️  Service not found (404)"
  echo "The deployment may not exist yet. Please deploy first using deploy.js"
else
  echo "⚠️  Unexpected status: $HTTP_STATUS"
  echo "Response:"
  echo "$BODY" | head -10
fi
