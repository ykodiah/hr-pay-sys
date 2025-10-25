# Deployment Guide

This document outlines the deployment process for AkwaabaHRPay - HR & Payroll Management System.

## 🚀 Automatic Deployment

### GitHub Actions CI/CD

The project is configured with GitHub Actions for automatic builds and deployments:

- **Trigger**: Pushes to `main`, `develop`, and `cursor/*` branches
- **Pull Requests**: Automatic preview deployments
- **Production**: Automatic deployment to production on `main` branch pushes

### Required Secrets

Add these secrets to your GitHub repository settings:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## 🛠️ Manual Deployment

### Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Using Deployment Script

Run the automated deployment script:

```bash
./scripts/deploy.sh
```

## 📋 Pre-deployment Checklist

- [ ] All tests pass
- [ ] Linting passes
- [ ] Build completes successfully
- [ ] Environment variables are configured
- [ ] Database migrations are ready (if applicable)

## 🔧 Environment Variables

Ensure these environment variables are set in your deployment platform:

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Optional
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

## 📊 Build Information

- **Framework**: Next.js 15.2.4
- **Node Version**: 18.x
- **Package Manager**: npm
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 🚨 Troubleshooting

### Build Failures
1. Check Node.js version (requires 18.x)
2. Clear node_modules and reinstall: `rm -rf node_modules && npm ci`
3. Check for TypeScript errors: `npm run build`

### Deployment Issues
1. Verify environment variables
2. Check Vercel project settings
3. Review build logs in GitHub Actions

## 📈 Monitoring

- **Build Status**: Check GitHub Actions tab
- **Deployment Status**: Check Vercel dashboard
- **Application Logs**: Available in Vercel dashboard

## 🔄 Rollback

To rollback to a previous deployment:

1. Go to Vercel dashboard
2. Select your project
3. Go to Deployments tab
4. Click "Promote to Production" on the desired deployment