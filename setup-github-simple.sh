#!/bin/bash

# Simple script to set up GitHub repository for archland48

GITHUB_USERNAME="archland48"
REPO_NAME="Arkchat"

echo "🚀 Setting up GitHub repository for $REPO_NAME"
echo ""

# Remove existing remote if any
git remote remove origin 2>/dev/null

# Add remote
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

echo "✅ Remote repository configured:"
git remote -v
echo ""

echo "📝 Next steps:"
echo ""
echo "1. Create the repository on GitHub:"
echo "   Go to: https://github.com/new"
echo "   Repository name: $REPO_NAME"
echo "   Make it Public"
echo "   DO NOT initialize with README, .gitignore, or license"
echo "   Click 'Create repository'"
echo ""
echo "2. After creating the repository, run:"
echo "   git push -u origin main"
echo ""
echo "3. Then deploy with:"
echo "   export REPO_URL=https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   node deploy.js"
