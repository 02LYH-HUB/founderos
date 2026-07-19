-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dtgdgefoketftawqniyg/sql/new

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
