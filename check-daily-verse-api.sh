#!/bin/bash

# 检查每日经文 API 部署状态

echo "🔍 检查每日经文 API 部署状态..."
echo ""

# 检查本地构建
echo "📦 检查本地构建..."
if [ -d ".next" ]; then
    echo "✅ .next 目录存在"
else
    echo "❌ .next 目录不存在，需要运行: npm run build"
fi

# 检查 API 文件是否存在
echo ""
echo "📁 检查 API 文件..."
if [ -f "app/api/daily-verse/route.ts" ]; then
    echo "✅ daily-verse API 路由文件存在"
else
    echo "❌ daily-verse API 路由文件不存在"
fi

# 检查部署配置
echo ""
echo "⚙️  检查部署配置..."
if [ -f "deploy-config.json" ]; then
    echo "✅ deploy-config.json 存在"
    REPO_URL=$(grep -o '"repo_url": "[^"]*"' deploy-config.json | cut -d'"' -f4)
    if [ -z "$REPO_URL" ]; then
        echo "⚠️  repo_url 未设置"
    else
        echo "   Repo URL: $REPO_URL"
    fi
else
    echo "❌ deploy-config.json 不存在"
fi

# 检查 Git 状态
echo ""
echo "🔗 检查 Git 状态..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    REMOTE=$(git remote get-url origin 2>/dev/null)
    if [ -n "$REMOTE" ]; then
        echo "✅ Git remote: $REMOTE"
    else
        echo "⚠️  Git remote 未设置"
    fi
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  有未提交的更改:"
        git status --short | head -5
    else
        echo "✅ 所有更改已提交"
    fi
else
    echo "❌ 不是 Git 仓库"
fi

# 检查部署状态（需要网络访问）
echo ""
echo "🌐 检查在线部署状态..."
echo "   尝试访问: https://arkchat.ai-builders.space/api/daily-verse"
echo ""
echo "   如果部署成功，应该返回 JSON 格式的经文数据"
echo "   如果返回 404，说明 API 路由未部署"
echo "   如果无法连接，请检查部署状态"

# 提供测试命令
echo ""
echo "📝 测试命令:"
echo "   curl https://arkchat.ai-builders.space/api/daily-verse"
echo ""
echo "📝 本地测试命令:"
echo "   npm run dev"
echo "   curl http://localhost:3000/api/daily-verse"
echo ""
echo "📝 部署命令:"
echo "   export REPO_URL=https://github.com/archland48/Arkchat"
echo "   export AI_BUILDER_TOKEN=your_token_here"
echo "   node deploy.js"
echo ""
echo "Or load from .env.local:"
echo "   source .env.local"
echo "   export REPO_URL=https://github.com/archland48/Arkchat"
echo "   node deploy.js"
