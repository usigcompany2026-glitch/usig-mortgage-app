#!/bin/bash

# USIG Mortgage App - Secure Deployment Script
# Run this once to deploy the app to GitHub + Netlify

set -e

echo "=================================================="
echo "USIG Mortgage App - Deployment"
echo "=================================================="

# Step 1: Setup
echo ""
echo "Step 1: Setting up project..."
cd usig-app
npm install

# Step 2: Initialize Git
echo ""
echo "Step 2: Initializing Git repository..."
git init
git add .
git commit -m "Initial commit: USIG Mortgage App"
git branch -M main

# Step 3: GitHub Instructions
echo ""
echo "=================================================="
echo "Step 3: GitHub Setup (OAuth - Safe)"
echo "=================================================="
echo ""
echo "COPY AND PASTE THIS INTO YOUR TERMINAL:"
echo ""
echo "# Authenticate with GitHub (opens browser)"
echo "gh auth login"
echo ""
echo "Then answer:"
echo "  What is your preferred protocol? → HTTPS"
echo "  Authenticate Git with your GitHub credentials? → Y"
echo "  How would you like to authenticate GitHub CLI? → Login with web browser"
echo ""
echo "Wait for browser to open, click Authorize, come back here."
echo ""
read -p "Press ENTER once GitHub CLI is authenticated..."

# Step 4: Create repo
echo ""
echo "Step 4: Creating GitHub repository..."
gh repo create usigcompany2026/usig-mortgage-app \
  --public \
  --source=. \
  --remote=origin \
  --push || echo "Repo may already exist, continuing..."

# Step 5: Get repo URL
REPO_URL=$(git config --get remote.origin.url)
echo ""
echo "✅ Repository created: $REPO_URL"

# Step 6: Netlify Instructions
echo ""
echo "=================================================="
echo "Step 5: Netlify Setup"
echo "=================================================="
echo ""
echo "1. Go to: https://app.netlify.com"
echo "2. Sign in with GitHub (usigcompany2026@gmail.com)"
echo "3. Click: Import from Git"
echo "4. Connect to GitHub → Select usig-mortgage-app repo"
echo "5. Build command: echo 'done'"
echo "6. Publish directory: ."
echo "7. Click: Deploy site"
echo ""
read -p "Once Netlify shows your site deployed, press ENTER..."

# Step 7: Environment Variables
echo ""
echo "=================================================="
echo "Step 6: Add Environment Variables to Netlify"
echo "=================================================="
echo ""
echo "In Netlify Dashboard:"
echo "  → Site Settings → Build & deploy → Environment"
echo "  → Add these variables:"
echo ""
echo "GHL_API_KEY = [From GoHighLevel → Settings → API Keys]"
echo "TWILIO_ACCOUNT_SID = [From Twilio Console]"
echo "TWILIO_AUTH_TOKEN = [From Twilio Console]"
echo "TWILIO_FROM_NUMBER = [Your Twilio number]"
echo "BRENDA_PHONE = +13104248338"
echo ""
read -p "Once variables are added, press ENTER..."

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "Your app is now live on:"
echo "  📱 Web: https://usig-mortgage-app.netlify.app"
echo "  📱 Mobile: Run 'expo start' to test locally"
echo ""
echo "Next steps:"
echo "1. Visit your Netlify URL"
echo "2. Test the form"
echo "3. Submit a test lead"
echo "4. Check GHL Contacts"
echo "5. Check SMS on your phone"
echo ""

