#!/bin/bash

# Remote Supabase Setup Script for Employee Management System
# This script helps you manage your remote Supabase database without Docker

echo "🚀 Setting up Remote Supabase Management for Employee Management System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Supabase CLI is available via npx
echo "📦 Using Supabase CLI via npx..."
if ! npx supabase --version &> /dev/null; then
    echo "❌ Supabase CLI not available via npx"
    exit 1
else
    echo "✅ Supabase CLI available via npx"
fi

# Create types directory if it doesn't exist
mkdir -p types

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "⚠️  Please update .env.local with your actual Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Remote Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your actual Supabase credentials"
echo "2. Link to your remote project: npx supabase link --project-ref YOUR_PROJECT_REF"
echo "3. Push migrations to remote: npx supabase db push"
echo "4. Generate TypeScript types: npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts"
echo "5. Start your Next.js app: npm run dev"
echo ""
echo "Useful commands for remote management:"
echo "- npx supabase link --project-ref YOUR_PROJECT_REF  # Link to remote project"
echo "- npx supabase db push                              # Push migrations to remote"
echo "- npx supabase db pull                              # Pull remote changes"
echo "- npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts  # Generate types"
echo "- npx supabase dashboard                            # Open Supabase Dashboard"
echo ""
echo "Your remote Supabase management is now ready! 🚀"