#!/bin/bash

# Script to check if AI Builder API token is valid

API_BASE_URL="https://space.ai-builders.com/backend/v1"
API_TOKEN="${AI_BUILDER_TOKEN}"

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

echo "🔍 Checking AI Builder API Token..."
echo ""
echo "Token (first 20 chars): ${API_TOKEN:0:20}..."
echo ""

# Test 1: Simple chat completion request
echo "📡 Test 1: Simple chat completion..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${API_BASE_URL}/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d '{
    "model": "grok-4-fast",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }' \
  --max-time 30)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ API Token is VALID"
  echo "Response preview:"
  echo "$BODY" | head -5
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ API Token is INVALID (401 Unauthorized)"
  echo "Response:"
  echo "$BODY"
elif [ "$HTTP_STATUS" = "504" ]; then
  echo "⚠️  Gateway Timeout (504) - API may be slow or overloaded"
  echo "This is NOT a token issue, but a timeout issue"
  echo "Response:"
  echo "$BODY"
elif [ "$HTTP_STATUS" = "429" ]; then
  echo "⚠️  Rate Limit (429) - Too many requests"
  echo "Token is valid but you've hit rate limits"
elif [ -z "$HTTP_STATUS" ]; then
  echo "❌ No response received - Check network connection"
else
  echo "⚠️  Unexpected status: $HTTP_STATUS"
  echo "Response:"
  echo "$BODY" | head -10
fi

echo ""
echo "---"
echo ""

# Test 2: Check token format
echo "📋 Test 2: Token format check..."
if [[ "$API_TOKEN" =~ ^sk_[a-zA-Z0-9_]+$ ]]; then
  echo "✅ Token format is valid (starts with 'sk_')"
else
  echo "⚠️  Token format may be invalid (should start with 'sk_')"
fi

echo ""
echo "---"
echo ""

# Summary
echo "📊 Summary:"
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ API Token is working correctly"
  echo "💡 If you're still getting 504 errors, it's likely a timeout issue, not a token issue"
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ API Token is invalid or expired"
  echo "💡 Please check your AI_BUILDER_TOKEN environment variable"
elif [ "$HTTP_STATUS" = "504" ]; then
  echo "⚠️  Gateway Timeout - This is NOT a token issue"
  echo "💡 Possible causes:"
  echo "   - API server is slow or overloaded"
  echo "   - Network issues"
  echo "   - Request is taking too long (try simpler queries)"
else
  echo "⚠️  Unable to determine token status"
  echo "💡 Check the HTTP status code above"
fi
