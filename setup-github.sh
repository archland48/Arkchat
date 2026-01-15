#!/bin/bash

# Script to set up GitHub repository for Arkchat

REPO_NAME="Arkchat"
GITHUB_USERNAME=""

echo "🚀 Setting up GitHub repository for $REPO_NAME"
echo ""

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI found"
    
    # Check if user is logged in
    if gh auth status &> /dev/null; then
        echo "✅ GitHub CLI authenticated"
        
        # Get username
        GITHUB_USERNAME=$(gh api user --jq .login)
        echo "📝 GitHub username: $GITHUB_USERNAME"
        
        # Create repository
        echo ""
        echo "📦 Creating repository $REPO_NAME..."
        gh repo create $REPO_NAME --public --source=. --remote=origin --push
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Repository created successfully!"
            echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
            echo ""
            echo "📝 To deploy, run:"
            echo "   export REPO_URL=https://github.com/$GITHUB_USERNAME/$REPO_NAME"
            echo "   node deploy.js"
        else
            echo "❌ Failed to create repository"
            exit 1
        fi
    else
        echo "❌ GitHub CLI not authenticated. Please run: gh auth login"
        exit 1
    fi
else
    echo "⚠️  GitHub CLI not found. Please install it or create repository manually:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create a new public repository named: $REPO_NAME"
    echo "3. Run these commands:"
    echo ""
    echo "   git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
    echo "   git push -u origin main"
    echo ""
    echo "4. Then deploy with:"
    echo "   export REPO_URL=https://github.com/YOUR_USERNAME/$REPO_NAME"
    echo "   node deploy.js"
fi
