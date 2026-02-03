# Environment Variables Setup

## Overview

This project uses environment variables to store sensitive information like API tokens. **Never commit `.env.local` to git** - it's already in `.gitignore`.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your actual token:**
   ```bash
   # .env.local
   AI_BUILDER_TOKEN=sk_your_actual_token_here
   REPO_URL=https://github.com/yourusername/Arkchat
   ```

3. **Load environment variables:**
   ```bash
   # Option 1: Use the helper script
   source load-env.sh
   
   # Option 2: Manual export
   export $(grep -v '^#' .env.local | xargs)
   
   # Option 3: Direct export
   export AI_BUILDER_TOKEN=sk_your_token_here
   ```

## Environment Variables

### Required Variables

- **`AI_BUILDER_TOKEN`**: Your AI Builder API token
  - Get it from: https://www.ai-builders.com
  - Format: `sk_...`

### Optional Variables

- **`REPO_URL`**: GitHub repository URL (for deployment)
  - Example: `https://github.com/yourusername/Arkchat`

## Usage Examples

### Running Scripts

All scripts now require `AI_BUILDER_TOKEN` to be set:

```bash
# Load from .env.local
source load-env.sh

# Then run scripts
./check-api-token.sh
./check-deployment.sh
node deploy.js
```

### Deploying

```bash
# Load environment variables
source load-env.sh

# Set repository URL
export REPO_URL=https://github.com/archland48/Arkchat

# Deploy
node deploy.js
```

### Development

Next.js automatically loads `.env.local` for development:

```bash
# .env.local is automatically loaded by Next.js
npm run dev
```

## Security Notes

1. ✅ **`.env.local` is in `.gitignore`** - it won't be committed
2. ✅ **`.env.example` is safe to commit** - it contains no real tokens
3. ✅ **Never share your token** - keep it private
4. ✅ **Rotate tokens** if accidentally exposed

## Troubleshooting

### "AI_BUILDER_TOKEN environment variable is not set"

**Solution:**
```bash
# Check if .env.local exists
ls -la .env.local

# If not, create it
cp .env.example .env.local
# Then edit .env.local with your token

# Load it
source load-env.sh

# Verify
echo $AI_BUILDER_TOKEN
```

### Scripts still using old hardcoded token

**Solution:**
- Make sure you've pulled the latest code: `git pull`
- All scripts have been updated to use environment variables
- No hardcoded tokens remain in the codebase

## Files Changed

The following files have been updated to use environment variables:

- ✅ `deploy.js` - Requires `AI_BUILDER_TOKEN`
- ✅ `check-api-token.sh` - Requires `AI_BUILDER_TOKEN`
- ✅ `check-deployment.sh` - Requires `AI_BUILDER_TOKEN`
- ✅ `check-bible-study-deployment.sh` - Requires `AI_BUILDER_TOKEN`
- ✅ `check-daily-verse-api.sh` - Updated examples
- ✅ `update-deployment-env.sh` - Requires `AI_BUILDER_TOKEN`
- ✅ `create-github-repo.sh` - Updated examples

## Next Steps

1. Ensure `.env.local` exists with your token
2. Use `source load-env.sh` before running scripts
3. For deployment, ensure the token is set in the deployment platform's environment variables
