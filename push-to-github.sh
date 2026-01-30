#!/bin/bash
# 推送代码到 GitHub 仓库（使用 GitHub CLI）

# Ensure GitHub CLI is in PATH
export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"

echo "📤 Pushing code to GitHub..."
echo ""

# Check if GitHub CLI is available and authenticated
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    echo "✅ Using GitHub CLI for authentication"
    echo ""
    
    # Ensure remote is set
    if ! git remote get-url origin &> /dev/null; then
        git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    else
        git remote set-url origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    fi
else
    echo "⚠️  GitHub CLI not authenticated"
    echo ""
    echo "Please authenticate by running:"
    echo "  gh auth login"
    echo ""
    echo "Or use push-with-token.sh with GITHUB_TOKEN"
    exit 1
fi

# 确保所有更改已提交
git add -A

if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')" || git commit -m "Prepare for deployment"
fi

# 推送代码
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "🌐 Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo ""
    echo "📝 To deploy, run:"
    echo "   export REPO_URL=https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo "   node deploy.js"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "   1. Repository exists at https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo "   2. You have push access"
    echo "   3. Check authentication: gh auth status"
fi
