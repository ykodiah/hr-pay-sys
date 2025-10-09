#!/bin/bash

# Supabase Setup Script for Employee Management System
# This script sets up Supabase CLI and initializes the project

echo "🚀 Setting up Supabase CLI for Employee Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install Supabase CLI globally
echo "📦 Installing Supabase CLI..."
npm install -g supabase

# Check if installation was successful
if ! command -v supabase &> /dev/null; then
    echo "❌ Failed to install Supabase CLI. Please try again."
    exit 1
fi

echo "✅ Supabase CLI installed successfully!"

# Initialize Supabase project (if not already initialized)
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Start Supabase local development
echo "🏃 Starting Supabase local development..."
supabase start

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
supabase gen types typescript --local > types/supabase.ts

echo "🎉 Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.local.example to .env.local"
echo "2. Update the environment variables with your actual values"
echo "3. Run 'npm run supabase:db:push' to apply migrations"
echo "4. Run 'npm run dev' to start your Next.js application"
echo ""
echo "Useful commands:"
echo "- npm run supabase:start    # Start local Supabase"
echo "- npm run supabase:stop     # Stop local Supabase"
echo "- npm run supabase:status   # Check Supabase status"
echo "- npm run supabase:db:push  # Push migrations to remote"
echo "- npm run supabase:gen:types # Generate TypeScript types"