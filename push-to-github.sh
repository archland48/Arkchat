#!/bin/bash
# 推送代码到 GitHub 仓库

echo "📤 Pushing code to GitHub..."
echo ""

# 确保所有更改已提交
git add -A
git commit -m "Prepare for deployment" 2>/dev/null

# 推送代码
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "🌐 Repository: https://github.com/archland48/Arkchat"
    echo ""
    echo "📝 To deploy, run:"
    echo "   export REPO_URL=https://github.com/archland48/Arkchat"
    echo "   node deploy.js"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "   1. Repository exists at https://github.com/archland48/Arkchat"
    echo "   2. You have push access"
    echo "   3. Repository is empty (no README, .gitignore, or license)"
fi
