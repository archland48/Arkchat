#!/bin/bash

# Script to create GitHub repository using GitHub API
# Requires GitHub Personal Access Token with repo scope

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"
GITHUB_TOKEN=""

echo "🚀 Creating GitHub repository: $REPO_NAME"
echo ""

# Check if token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GitHub token not set in script"
    echo ""
    echo "Please create a Personal Access Token at: https://github.com/settings/tokens"
    echo "Token needs 'repo' scope"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo "  ./create-repo.sh"
    exit 1
fi

# Create repository using GitHub API
echo "📦 Creating repository..."
RESPONSE=$(curl -s -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"A modern ChatGPT clone built with Next.js\",\"public\":true}")

# Check if repository was created
if echo "$RESPONSE" | grep -q '"name"'; then
    echo "✅ Repository created successfully!"
    echo ""
    echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    
    # Add remote and push
    echo "📤 Pushing code to GitHub..."
    git remote remove origin 2>/dev/null
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Code pushed successfully!"
        echo ""
        echo "🌐 Repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        echo ""
        echo "📝 To deploy, run:"
        echo "   export REPO_URL=https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        echo "   node deploy.js"
    else
        echo "❌ Failed to push code"
    fi
else
    echo "❌ Failed to create repository"
    echo "Response: $RESPONSE"
    exit 1
fi
