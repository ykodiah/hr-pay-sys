# Supabase CLI Setup Guide for Employee Management System

This guide will help you set up Supabase CLI integration with Cursor so that your database updates automatically.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- A Supabase account and project

## Step 1: Install Supabase CLI

### Option A: Using npm (Recommended)
```bash
npm install -g supabase
```

### Option B: Using Homebrew (macOS)
```bash
brew install supabase/tap/supabase
```

### Option C: Using Scoop (Windows)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Step 2: Initialize Supabase in Your Project

1. Navigate to your project directory in Cursor
2. Run the initialization command:
```bash
supabase init
```

This will create the `supabase/` directory with configuration files.

## Step 3: Configure Your Project

1. Copy the environment file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your Supabase project details:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Link to Your Remote Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project reference in your Supabase dashboard URL.

## Step 5: Start Local Development

```bash
supabase start
```

This will:
- Start a local Supabase instance
- Create a local database
- Apply all migrations
- Start Supabase Studio

## Step 6: Apply Migrations to Remote

```bash
supabase db push
```

This will apply all your local migrations to your remote Supabase project.

## Step 7: Generate TypeScript Types

```bash
supabase gen types typescript --local > types/supabase.ts
```

## Development Workflow

### Daily Development
1. Start your local Supabase: `supabase start`
2. Make changes to your database schema
3. Create migrations: `supabase migration new migration_name`
4. Test locally
5. Push to remote: `supabase db push`

### Creating New Migrations
1. Make changes to your database schema
2. Generate migration: `supabase db diff -f migration_name`
3. Review the generated migration file
4. Apply locally: `supabase db reset`
5. Push to remote: `supabase db push`

### Updating from Remote
1. Pull remote changes: `supabase db pull`
2. Generate types: `supabase gen types typescript --local > types/supabase.ts`

## Useful Commands

### Database Management
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# Reset local database
supabase db reset

# Push migrations to remote
supabase db push

# Pull remote changes
supabase db pull

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

### Studio and Dashboard
```bash
# Open local Supabase Studio
supabase studio

# Open remote Supabase Dashboard
supabase dashboard
```

### Logs and Debugging
```bash
# View logs
supabase logs

# Check specific service logs
supabase logs --service api
supabase logs --service db
```

## NPM Scripts Integration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:status": "supabase status",
    "supabase:db:push": "supabase db push",
    "supabase:db:pull": "supabase db pull",
    "supabase:db:diff": "supabase db diff",
    "supabase:gen:types": "supabase gen types typescript --local > types/supabase.ts",
    "supabase:link": "supabase link --project-ref YOUR_PROJECT_REF",
    "supabase:unlink": "supabase unlink",
    "dev": "supabase start && next dev",
    "build": "supabase db push && next build"
  }
}
```

## Cursor Integration

### Terminal Integration
1. Open terminal in Cursor (`Ctrl+`` or `Cmd+``)
2. Run Supabase commands directly
3. Use the integrated terminal for all database operations

### File Watching
1. Supabase CLI automatically watches for changes
2. Migrations are applied automatically when you save files
3. TypeScript types are regenerated automatically

### Debugging
1. Use `supabase logs` to debug issues
2. Check `supabase status` for service health
3. Use Supabase Studio for database inspection

## Troubleshooting

### Common Issues

#### 1. Supabase CLI Not Found
```bash
# Reinstall globally
npm install -g supabase

# Or use npx
npx supabase start
```

#### 2. Port Already in Use
```bash
# Stop existing services
supabase stop

# Start again
supabase start
```

#### 3. Migration Conflicts
```bash
# Reset local database
supabase db reset

# Pull latest from remote
supabase db pull

# Apply local changes
supabase db push
```

#### 4. TypeScript Types Not Updating
```bash
# Regenerate types
supabase gen types typescript --local > types/supabase.ts

# Or use the npm script
npm run supabase:gen:types
```

### Getting Help

1. Check Supabase documentation: https://supabase.com/docs
2. View CLI help: `supabase --help`
3. Check specific command help: `supabase db --help`
4. View logs: `supabase logs`

## Production Deployment

### 1. Environment Variables
Ensure your production environment has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Migrations
```bash
# Link to production
supabase link --project-ref YOUR_PROD_PROJECT_REF

# Push migrations
supabase db push
```

### 3. TypeScript Types
```bash
# Generate production types
supabase gen types typescript --project-id YOUR_PROD_PROJECT_REF > types/supabase.ts
```

## Best Practices

1. **Always test locally first** before pushing to remote
2. **Use descriptive migration names** that explain what changed
3. **Review generated migrations** before applying them
4. **Keep your local and remote in sync** by pulling regularly
5. **Use TypeScript types** for better development experience
6. **Backup your data** before major schema changes
7. **Use environment variables** for sensitive configuration

## Next Steps

1. Run `supabase start` to begin development
2. Make your first migration
3. Test your changes locally
4. Push to remote when ready
5. Deploy your application

Your Supabase CLI is now fully integrated with Cursor and ready for development! 🚀