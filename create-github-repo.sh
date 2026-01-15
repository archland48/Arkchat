#!/bin/bash

# Script to create GitHub repository with GitHub CLI
# GitHub CLI location: /Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin/gh

export PATH="/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:$PATH"

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"

echo "🚀 Creating GitHub repository: $REPO_NAME"
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI not authenticated"
    echo ""
    echo "Please authenticate by running:"
    echo "  export PATH=\"/Users/apple/Downloads/gh_2.85.0_macOS_amd64/bin:\$PATH\""
    echo "  gh auth login"
    echo ""
    echo "Or set GH_TOKEN environment variable:"
    echo "  export GH_TOKEN=your_github_token"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Check if repository already exists
if gh repo view "$GITHUB_USERNAME/$REPO_NAME" &> /dev/null; then
    echo "⚠️  Repository already exists: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📤 Pushing code to existing repository..."
    git remote remove origin 2>/dev/null
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Code pushed successfully!"
    else
        echo "❌ Failed to push code"
        exit 1
    fi
else
    echo "📦 Creating new repository..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Repository created and code pushed successfully!"
    else
        echo "❌ Failed to create repository"
        exit 1
    fi
fi

echo ""
echo "🌐 Repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "📝 To deploy, run:"
echo "   export REPO_URL=https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
echo "   node deploy.js"
