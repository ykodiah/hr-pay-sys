# Remote Supabase Management Guide

Since Docker is not available in this environment, this guide will help you manage your remote Supabase database directly.

## Prerequisites

- A Supabase account and project
- Your project reference ID (found in your Supabase dashboard URL)
- Your Supabase API keys

## Step 1: Get Your Supabase Project Details

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the following:
   - Project URL
   - Anon public key
   - Service role key (secret)

## Step 2: Update Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 3: Link to Your Remote Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

## Step 4: Apply Database Migrations

Run the migration script to update your remote database:

```bash
npx supabase db push
```

This will apply all the migrations we created:
- Add annual salary column
- Create custom banks table
- Remove loan columns
- Set up RLS policies

## Step 5: Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts
```

## Step 6: Verify the Changes

You can verify the changes by:

1. **Check the Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Table Editor
   - Verify the `employee_financial` table has the `annual_salary` column
   - Verify the `custom_banks` table exists

2. **Run a test query:**
   ```sql
   -- Check if annual_salary column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'employee_financial' 
   AND column_name = 'annual_salary';
   
   -- Check if custom_banks table exists
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'custom_banks';
   ```

## Available Commands

### Database Management
```bash
# Push migrations to remote
npx supabase db push

# Pull remote changes
npx supabase db pull

# Generate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts

# Create new migration
npx supabase migration new migration_name

# View migration history
npx supabase migration list
```

### Project Management
```bash
# Link to remote project
npx supabase link --project-ref YOUR_PROJECT_REF

# Unlink from project
npx supabase unlink

# Open Supabase Dashboard
npx supabase dashboard

# Check project status
npx supabase projects list
```

### Development Workflow
```bash
# Start your Next.js app
npm run dev

# Build for production
npm run build

# Generate types (using npm script)
npm run supabase:gen:types
```

## NPM Scripts

I've added these scripts to your `package.json`:

```json
{
  "scripts": {
    "supabase:db:push": "npx supabase db push",
    "supabase:db:pull": "npx supabase db pull",
    "supabase:gen:types": "npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts",
    "supabase:link": "npx supabase link --project-ref YOUR_PROJECT_REF",
    "supabase:unlink": "npx supabase unlink",
    "supabase:dashboard": "npx supabase dashboard"
  }
}
```

## Testing Your Changes

1. **Start your Next.js application:**
   ```bash
   npm run dev
   ```

2. **Test the employee form:**
   - Navigate to the employee management page
   - Try adding a new employee
   - Test the annual salary field
   - Test the custom bank functionality

3. **Verify database changes:**
   - Check that annual salary is saved
   - Check that custom banks are created
   - Verify that loan fields are not present

## Troubleshooting

### Common Issues

1. **"Project not found" error:**
   - Verify your project reference ID is correct
   - Make sure you're logged in: `npx supabase login`

2. **"Permission denied" error:**
   - Check your API keys are correct
   - Verify you have the right permissions

3. **Migration conflicts:**
   - Pull latest changes: `npx supabase db pull`
   - Resolve conflicts manually
   - Push changes: `npx supabase db push`

4. **TypeScript types not updating:**
   - Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts`

### Getting Help

1. Check Supabase documentation: https://supabase.com/docs
2. View CLI help: `npx supabase --help`
3. Check specific command help: `npx supabase db --help`

## Next Steps

1. **Update your environment variables** with actual Supabase credentials
2. **Link to your remote project** using the project reference ID
3. **Push the migrations** to update your database
4. **Generate TypeScript types** for better development experience
5. **Test the functionality** in your application

Your remote Supabase database is now ready for the updated employee financial form! 🚀