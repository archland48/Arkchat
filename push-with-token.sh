#!/bin/bash

# Script to push code using GitHub token
# Usage: export GITHUB_TOKEN=your_token && ./push-with-token.sh

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is required"
    echo ""
    echo "To get a token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo "  ./push-with-token.sh"
    exit 1
fi

echo "📤 Pushing code to GitHub..."
echo ""

# Update remote URL to include token
git remote set-url origin https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# Push code
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed successfully!"
    echo ""
    echo "🌐 Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo ""
    echo "📝 Deployment is already queued. The platform will pull the code automatically."
    echo "🌐 Your app will be available at: https://arkchat.ai-builders.space"
else
    echo ""
    echo "❌ Push failed"
    exit 1
fi
