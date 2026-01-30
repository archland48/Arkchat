#!/bin/bash

# Script to push code using GitHub CLI (recommended) or GitHub token (fallback)
# Usage: ./push-with-token.sh
# Or: export GITHUB_TOKEN=your_token && ./push-with-token.sh

# Ensure GitHub CLI is in PATH
export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"

# Try to use GitHub CLI first (more secure and maintains session)
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    echo "✅ Using GitHub CLI for authentication"
    echo ""
    
    # Use GitHub CLI approach
    git remote set-url origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    git add -A
    
    if git diff --staged --quiet; then
        echo "ℹ️  No changes to commit"
    else
        git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')" || git commit -m "Update"
    fi
    
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Code pushed successfully using GitHub CLI!"
        echo ""
        echo "🌐 Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
        echo ""
        echo "📝 Deployment is already queued. The platform will pull the code automatically."
        echo "🌐 Your app will be available at: https://arkchat.ai-builders.space"
        exit 0
    else
        echo "⚠️  GitHub CLI push failed, falling back to token method..."
        echo ""
    fi
fi

# Fallback to token method if GitHub CLI is not available or failed
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GitHub CLI not authenticated and GITHUB_TOKEN not provided"
    echo ""
    echo "Option 1 (Recommended): Use GitHub CLI"
    echo "  gh auth login"
    echo "  ./push-with-token.sh"
    echo ""
    echo "Option 2: Use GitHub Token"
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

echo "📤 Pushing code to GitHub using token..."
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
