-- Add images_json column to products table for storing multiple image URLs
-- Used by local shop articles to display image galleries from Google Places
ALTER TABLE products ADD COLUMN IF NOT EXISTS images_json TEXT;
