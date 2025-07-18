#!/bin/bash

echo "🚀 Deploying Swiss Bookkeeping Agent to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "Please login to Railway:"
railway login

# Initialize project
echo "Initializing Railway project..."
railway init

# Set environment variables
echo "Setting environment variables..."
railway variables set ANTHROPIC_API_KEY=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
railway variables set NODE_ENV=production
railway variables set LLM_PROVIDER=anthropic
railway variables set ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Deploy
echo "Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "Your Swiss Bookkeeping Agent is now live!"