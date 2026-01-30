#!/bin/bash

# Script to push code using GitHub CLI
# This script uses GitHub CLI for authentication, which is more secure and maintains session

# Ensure GitHub CLI is in PATH
export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"

echo "📤 Pushing code to GitHub using GitHub CLI..."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed or not in PATH"
    echo ""
    echo "Please add GitHub CLI to your PATH:"
    echo "  export PATH=\"/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:\$PATH\""
    echo ""
    echo "Or add it to your ~/.bash_profile or ~/.zshrc:"
    echo "  export PATH=\"/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:\$PATH\""
    exit 1
fi

# Check if GitHub CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI not authenticated"
    echo ""
    echo "Please authenticate by running:"
    echo "  gh auth login"
    echo ""
    echo "This will open a browser or prompt for authentication."
    echo "After authentication, run this script again."
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Ensure we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if remote exists, if not add it
if ! git remote get-url origin &> /dev/null; then
    echo "📝 Adding remote origin..."
    git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
fi

# Update remote URL to use GitHub CLI authentication
echo "🔗 Setting up remote URL..."
git remote set-url origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Stage all changes
echo "📝 Staging changes..."
git add -A

# Commit if there are changes
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')" || git commit -m "Update"
fi

# Push code using git (GitHub CLI handles authentication automatically)
echo "🚀 Pushing to GitHub..."
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
    echo ""
    echo "Troubleshooting:"
    echo "1. Check authentication: gh auth status"
    echo "2. Re-authenticate if needed: gh auth login"
    echo "3. Check repository access: gh repo view ${GITHUB_USERNAME}/${REPO_NAME}"
    exit 1
fi
