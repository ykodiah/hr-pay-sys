#!/bin/bash

# Quick Supabase Setup Script for Employee Management System
# Run this script in Cursor terminal to set up Supabase CLI

echo "🚀 Setting up Supabase CLI for Employee Management System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install Supabase CLI if not already installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI already installed"
fi

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
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

# Start Supabase local development
echo "🏃 Starting Supabase local development..."
supabase start

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
supabase gen types typescript --local > types/supabase.ts

echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your actual Supabase credentials"
echo "2. Link to your remote project: supabase link --project-ref YOUR_PROJECT_REF"
echo "3. Push migrations to remote: supabase db push"
echo "4. Start your Next.js app: npm run dev"
echo ""
echo "Useful commands:"
echo "- supabase start     # Start local Supabase"
echo "- supabase stop      # Stop local Supabase"
echo "- supabase status    # Check status"
echo "- supabase db push   # Push migrations to remote"
echo "- supabase studio    # Open Supabase Studio"
echo ""
echo "Your Supabase CLI is now ready to use! 🚀"