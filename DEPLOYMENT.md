# Deployment Guide for Arkchat

## Prerequisites

1. **GitHub Account** - You need a GitHub account
2. **GitHub Personal Access Token** (optional, for automated setup) - Create one at https://github.com/settings/tokens with `repo` scope
3. **Docker** (for local testing) - Install from https://www.docker.com/products/docker-desktop

## Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

If you have GitHub CLI installed:

```bash
# Authenticate (if not already done)
gh auth login

# Create and push repository
./setup-github.sh
```

### Option B: Manual Setup

1. Go to https://github.com/new
2. Repository name: `Arkchat`
3. Make it **Public**
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

Then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Arkchat.git
git push -u origin main
```

## Step 2: Test Docker Build (Optional but Recommended)

Before deploying, test the Docker build locally:

```bash
# Make sure Docker is running
./test-docker.sh
```

Or manually:

```bash
# Build the image
docker build -t arkchat:test .

# Run the container
docker run -d -p 3000:3000 -e PORT=3000 arkchat:test

# Test it
curl http://localhost:3000

# Stop and remove
docker stop $(docker ps -q --filter ancestor=arkchat:test)
docker rm $(docker ps -q --filter ancestor=arkchat:test)
```

## Step 3: Deploy to AI Builder Platform

Once your code is pushed to GitHub:

```bash
export REPO_URL=https://github.com/YOUR_USERNAME/Arkchat
export AI_BUILDER_TOKEN=sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587
node deploy.js
```

Or use curl directly:

```bash
curl -X POST https://space.ai-builders.com/backend/v1/deployments \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/YOUR_USERNAME/Arkchat",
    "service_name": "arkchat",
    "branch": "main",
    "port": 3000
  }'
```

## Step 4: Monitor Deployment

Check deployment status:

```bash
curl https://space.ai-builders.com/backend/v1/deployments/arkchat \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
```

View logs:

```bash
curl https://space.ai-builders.com/backend/v1/deployments/arkchat/logs?log_type=build \
  -H "Authorization: Bearer sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587"
```

## Your App URL

Once deployed, your app will be available at:
**https://arkchat.ai-builders.space**

Deployment typically takes 5-10 minutes.
