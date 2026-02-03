#!/bin/bash

# Script to check deployment status

API_BASE_URL="https://space.ai-builders.com/backend"
SERVICE_NAME="arkchat"
AI_BUILDER_TOKEN="${AI_BUILDER_TOKEN}"

if [ -z "$AI_BUILDER_TOKEN" ]; then
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

echo "📊 Checking deployment status for $SERVICE_NAME..."
echo ""

# Check deployment status
STATUS=$(curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}" | \
  python3 -c "import sys, json; d=json.load(sys.stdin); print(d['status']); print(d.get('koyeb_status', 'N/A')); print(d.get('message', '')[:150])" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "$STATUS" | head -3 | while read line; do
        echo "$line"
    done
    echo ""
    echo "🌐 Public URL: https://${SERVICE_NAME}.ai-builders.space"
    echo ""
    echo "💡 To view full status:"
    echo "   curl ${API_BASE_URL}/v1/deployments/${SERVICE_NAME} -H \"Authorization: Bearer ${AI_BUILDER_TOKEN}\" | python3 -m json.tool"
    echo ""
    echo "📝 To view logs:"
    echo "   curl \"${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/logs?log_type=build\" -H \"Authorization: Bearer ${AI_BUILDER_TOKEN}\""
else
    echo "❌ Failed to check deployment status"
fi
