# Supabase CLI Commands for Employee Management System

This document contains all the Supabase CLI commands you'll need to manage your database.

## Initial Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Initialize Supabase Project
```bash
supabase init
```

### 3. Start Local Development
```bash
supabase start
```

### 4. Link to Remote Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## Database Management

### Apply Migrations to Remote
```bash
supabase db push
```

### Pull Remote Schema Changes
```bash
supabase db pull
```

### Generate TypeScript Types
```bash
supabase gen types typescript --local > types/supabase.ts
```

### Reset Local Database
```bash
supabase db reset
```

### Create New Migration
```bash
supabase migration new migration_name
```

## Development Workflow

### Start Local Supabase
```bash
npm run supabase:start
# or
supabase start
```

### Stop Local Supabase
```bash
npm run supabase:stop
# or
supabase stop
```

### Check Status
```bash
npm run supabase:status
# or
supabase status
```

### View Logs
```bash
supabase logs
```

## Database Operations

### Create Migration from Local Changes
```bash
supabase db diff -f migration_name
```

### Apply Specific Migration
```bash
supabase migration up migration_name
```

### Rollback Migration
```bash
supabase migration down migration_name
```

## Studio and Dashboard

### Open Supabase Studio (Local)
```bash
supabase studio
```

### Open Supabase Dashboard (Remote)
```bash
supabase dashboard
```

## Environment Management

### Set Environment Variables
```bash
supabase secrets set KEY=value
```

### List Environment Variables
```bash
supabase secrets list
```

## Troubleshooting

### Check Supabase Status
```bash
supabase status
```

### View Supabase Logs
```bash
supabase logs
```

### Restart Supabase
```bash
supabase stop
supabase start
```

### Reset Everything
```bash
supabase stop
supabase db reset
supabase start
```

## Useful NPM Scripts

Add these to your `package.json`:

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
    "supabase:unlink": "supabase unlink"
  }
}
```

## Quick Setup for New Developers

1. Clone the repository
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local`
4. Run `npm run supabase:start`
5. Run `npm run supabase:gen:types`
6. Run `npm run dev`

## Production Deployment

1. Link to your production project: `supabase link --project-ref YOUR_PROJECT_REF`
2. Push migrations: `supabase db push`
3. Update environment variables in your hosting platform
4. Deploy your application