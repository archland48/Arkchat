#!/bin/bash

# Script to check deployment status and code sync

echo "🔍 检查代码部署状态"
echo "=================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  source .env.local
fi

if [ -z "$AI_BUILDER_TOKEN" ]; then
  echo "❌ Error: AI_BUILDER_TOKEN not set"
  exit 1
fi

API_BASE_URL="https://space.ai-builders.com/backend"
SERVICE_NAME="arkchat"

echo "1️⃣  本地代码状态"
echo "----------------"
LOCAL_COMMIT=$(git log -1 --format="%H %ai %s")
echo "最新提交: $LOCAL_COMMIT"
echo ""

echo "2️⃣  部署平台状态"
echo "----------------"
DEPLOYMENT_INFO=$(curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}")

echo "$DEPLOYMENT_INFO" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('部署状态:', d.get('status'))
    print('最后部署时间:', d.get('last_deployed_at'))
    print('Git 提交ID:', d.get('git_commit_id', 'N/A'))
    print('仓库URL:', d.get('repo_url'))
    print('分支:', d.get('branch'))
except:
    print(sys.stdin.read())
"
echo ""

echo "3️⃣  检查运行时日志中的新代码特征"
echo "----------------------------------"
RUNTIME_LOGS=$(curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}/logs?log_type=runtime" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}")

HAS_NEW_LOGS=$(echo "$RUNTIME_LOGS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    logs = d.get('logs', '')
    if '[ms] Request received' in logs or '[ms] Bible query' in logs:
        print('✅ 发现新代码特征（详细时间戳日志）')
    else:
        print('❌ 未发现新代码特征（可能代码未部署）')
        print('   当前日志格式: 旧版本')
except:
    pass
")

echo "$HAS_NEW_LOGS"
echo ""

echo "4️⃣  GitHub 仓库状态"
echo "-------------------"
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "N/A")
echo "远程仓库: $REMOTE_URL"

if [ "$REMOTE_URL" != "N/A" ]; then
  echo ""
  echo "💡 检查 GitHub 上的最新提交..."
  echo "   访问: https://github.com/archland48/Arkchat/commits/main"
fi
echo ""

echo "5️⃣  建议操作"
echo "-----------"
echo "如果代码未部署："
echo "  1. 确保代码已推送到 GitHub:"
echo "     git push origin main"
echo ""
echo "  2. 等待 5-10 分钟让平台自动检测并部署"
echo ""
echo "  3. 或手动触发部署:"
echo "     node deploy.js"
echo ""
echo "如果代码已部署但仍有问题："
echo "  1. 查看详细日志: ./view-logs.sh runtime"
echo "  2. 检查超时设置: grep 'API_TIMEOUT' app/api/chat/route.ts"
