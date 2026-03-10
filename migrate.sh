#!/bin/bash

# Database Migration Script
echo "🚀 Starting database migration..."

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digitaloffices_dev"

# Run migration
cd packages/database
pnpm db:push

echo "✅ Migration completed!"
