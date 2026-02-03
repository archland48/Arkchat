#!/bin/bash

# 检查 Bible Study 功能部署状态

echo "🔍 检查 Bible Study 功能部署状态..."
echo ""

# 1. 检查本地文件
echo "📁 检查本地文件..."
if [ -f "components/ChatTabs.tsx" ]; then
    echo "  ✅ ChatTabs.tsx 存在"
else
    echo "  ❌ ChatTabs.tsx 不存在"
fi

if [ -f "components/ChatArea.tsx" ]; then
    echo "  ✅ ChatArea.tsx 存在"
    if grep -q "ChatTabs" components/ChatArea.tsx; then
        echo "  ✅ ChatArea.tsx 已导入 ChatTabs"
    else
        echo "  ❌ ChatArea.tsx 未导入 ChatTabs"
    fi
else
    echo "  ❌ ChatArea.tsx 不存在"
fi

if [ -f "lib/bible-prompts.ts" ]; then
    echo "  ✅ bible-prompts.ts 存在"
else
    echo "  ❌ bible-prompts.ts 不存在"
fi

echo ""

# 2. 检查 Git 状态
echo "📦 检查 Git 状态..."
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "  ⚠️  有 $UNCOMMITTED 个未提交的文件"
    echo "  需要提交的文件："
    git status --short | head -10
else
    echo "  ✅ 所有文件已提交"
fi

echo ""

# 3. 检查远程仓库
echo "🌐 检查远程仓库..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo "  ✅ 远程仓库: $REMOTE_URL"
else
    echo "  ❌ 未配置远程仓库"
fi

echo ""

# 4. 检查部署状态
echo "🚀 检查部署状态..."
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

STATUS_RESPONSE=$(curl -s "${API_BASE_URL}/v1/deployments/${SERVICE_NAME}" \
  -H "Authorization: Bearer ${AI_BUILDER_TOKEN}")

if [ $? -eq 0 ]; then
    STATUS=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('status', 'unknown'))" 2>/dev/null)
    if [ -n "$STATUS" ]; then
        echo "  部署状态: $STATUS"
        echo "  应用地址: https://${SERVICE_NAME}.ai-builders.space"
    else
        echo "  ⚠️  无法解析部署状态"
    fi
else
    echo "  ⚠️  无法连接到部署 API"
fi

echo ""
echo "📋 下一步操作："
echo "  1. 提交代码: git add . && git commit -m 'Add Bible Study toggle button'"
echo "  2. 推送到 GitHub: git push origin main"
echo "  3. 部署: export REPO_URL=https://github.com/archland48/Arkchat && node deploy.js"
echo "  4. 检查网站: https://arkchat.ai-builders.space/"
