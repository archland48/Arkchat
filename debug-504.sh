#!/bin/bash

# Quick diagnostic script for 504 errors
# Usage: ./debug-504.sh

echo "🔍 504 Error Diagnostic Tool"
echo "=============================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  source .env.local
fi

if [ -z "$AI_BUILDER_TOKEN" ]; then
  echo "❌ Error: AI_BUILDER_TOKEN not set"
  echo "Run: source .env.local && export AI_BUILDER_TOKEN"
  exit 1
fi

API_BASE_URL="https://space.ai-builders.com/backend"
SERVICE_NAME="arkchat"

echo "1️⃣  Checking deployment status..."
echo "-----------------------------------"
STATUS=$(curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}" | \
  python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('status', 'UNKNOWN'))" 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "✅ Deployment status: $STATUS"
else
  echo "❌ Failed to check status"
fi
echo ""

echo "2️⃣  Fetching recent app logs (last 50 lines)..."
echo "------------------------------------------------"
echo ""
curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/logs?log_type=app" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    logs = data.get('logs', '') if isinstance(data, dict) else str(data)
    if logs:
        lines = logs.split('\n')
        print('\n'.join(lines[-50:]))  # Last 50 lines
    else:
        print('No logs found')
except:
    print(sys.stdin.read())
" 2>/dev/null | tail -50
echo ""

echo "3️⃣  Searching for timeout/error patterns..."
echo "--------------------------------------------"
curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/logs?log_type=app" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    logs = data.get('logs', '') if isinstance(data, dict) else str(data)
    if logs:
        lines = logs.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['504', 'timeout', 'timed out', 'error', '[', 'ms]']):
                print(line)
except:
    pass
" 2>/dev/null | tail -30
echo ""

echo "4️⃣  Key timestamps (performance logs)..."
echo "-----------------------------------------"
curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/logs?log_type=app" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    logs = data.get('logs', '') if isinstance(data, dict) else str(data)
    if logs:
        lines = logs.split('\n')
        for line in lines:
            if '[ms]' in line or 'Request received' in line or 'Bible query' in line or 'Verse data' in line or 'AI API' in line:
                print(line)
except:
    pass
" 2>/dev/null | tail -20
echo ""

echo "💡 Next steps:"
echo "  - If you see '[Xms]' logs, check which step is slowest"
echo "  - Look for 'timed out' or 'timeout' messages"
echo "  - Check if Bible query detection is working correctly"
echo ""
echo "📝 To view full logs:"
echo "   ./view-logs.sh app"
echo ""
echo "🔧 To filter specific errors:"
echo "   ./view-logs.sh app | grep -E '504|timeout|error'"
