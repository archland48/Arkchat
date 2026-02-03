#!/bin/bash

# Script to view deployment logs
# Usage: ./view-logs.sh [log_type]
# log_type: build (default), app, or all

API_BASE_URL="https://space.ai-builders.com/backend"
SERVICE_NAME="arkchat"
LOG_TYPE="${1:-build}"  # Default to 'build' if not specified. Use 'runtime' for app logs.

# Load environment variables
if [ -f .env.local ]; then
  source .env.local
fi

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

echo "📝 Viewing logs for: $SERVICE_NAME"
echo "📋 Log type: $LOG_TYPE"
echo ""

# Function to view logs
view_logs() {
  local log_type=$1
  local url="${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/logs?log_type=${log_type}"
  
  echo "🔗 Fetching ${log_type} logs..."
  echo "URL: $url"
  echo ""
  echo "--- ${log_type^^} LOGS ---"
  echo ""
  
  curl -s "${url}" \
    -H "Authorization: Bearer ${AI_BUILDER_TOKEN}" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, dict):
        if 'logs' in data:
            print(data['logs'])
        elif 'message' in data:
            print(data['message'])
        else:
            print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(data)
except:
    print(sys.stdin.read())
" 2>/dev/null || curl -s "${url}" \
    -H "Authorization: Bearer ${AI_BUILDER_TOKEN}"
  
  echo ""
  echo "--- END ${log_type^^} LOGS ---"
  echo ""
}

# View logs based on type
case "$LOG_TYPE" in
  build)
    view_logs "build"
    ;;
  app|runtime)
    view_logs "runtime"
    ;;
  all)
    echo "📦 BUILD LOGS:"
    echo "=============="
    view_logs "build"
    echo ""
    echo "🚀 RUNTIME LOGS:"
    echo "================"
    view_logs "runtime"
    ;;
  *)
    echo "❌ Invalid log type: $LOG_TYPE"
    echo ""
    echo "Usage: $0 [log_type]"
    echo ""
    echo "Log types:"
    echo "  build   - Build/deployment logs (default)"
    echo "  app     - Application runtime logs (alias for 'runtime')"
    echo "  runtime - Application runtime logs"
    echo "  all     - Both build and runtime logs"
    echo ""
    echo "Examples:"
    echo "  $0           # View build logs"
    echo "  $0 app       # View app logs"
    echo "  $0 all       # View all logs"
    exit 1
    ;;
esac

echo ""
echo "💡 Tips:"
echo "  - Build logs show deployment/build process"
echo "  - App logs show runtime application logs (including your debug logs)"
echo "  - Look for timestamps like [Xms] to track performance"
echo ""
echo "🔍 To filter logs:"
echo "  $0 app | grep '\[.*ms\]'  # Show only timing logs"
echo "  $0 app | grep 'Bible query'  # Show Bible query logs"
echo "  $0 app | grep 'error\|Error\|ERROR'  # Show errors only"
