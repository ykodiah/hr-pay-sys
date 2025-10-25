# GitHub Secrets Setup Guide

To enable automatic deployments, you need to add the following secrets to your GitHub repository.

## 🔐 Required Secrets

### 1. Vercel Token
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create a new token with appropriate permissions
3. Copy the token
4. In GitHub: Settings → Secrets and variables → Actions → New repository secret
5. Name: `VERCEL_TOKEN`
6. Value: `your_vercel_token_here`

### 2. Vercel Organization ID
1. Go to [Vercel Dashboard](https://vercel.com/account)
2. Click on your team/organization
3. Go to Settings → General
4. Copy the "Team ID" (this is your Org ID)
5. In GitHub: Settings → Secrets and variables → Actions → New repository secret
6. Name: `VERCEL_ORG_ID`
7. Value: `your_org_id_here`

### 3. Vercel Project ID
1. Go to your project in Vercel Dashboard
2. Go to Settings → General
3. Copy the "Project ID"
4. In GitHub: Settings → Secrets and variables → Actions → New repository secret
5. Name: `VERCEL_PROJECT_ID`
6. Value: `your_project_id_here`

## 🚀 How to Get Vercel Credentials

### Option 1: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# This will show you the project ID and org ID
```

### Option 2: From Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → General
4. Find "Project ID" and "Team ID"

## ✅ Verification

After adding the secrets:
1. Go to Actions tab in your GitHub repository
2. You should see the "CI/CD Pipeline" workflow
3. The workflow will run automatically on pushes and pull requests
4. Check the workflow runs to ensure everything is working

## 🔧 Troubleshooting

### Common Issues:
- **Invalid token**: Make sure the Vercel token has the correct permissions
- **Project not found**: Verify the Project ID and Org ID are correct
- **Permission denied**: Ensure the token has access to the project

### Test the Setup:
1. Make a small change to any file
2. Commit and push the changes
3. Check the Actions tab to see if the workflow runs
4. Check Vercel dashboard to see if deployment is triggered