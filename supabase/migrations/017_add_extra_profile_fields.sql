-- Migration 017: Add optional extra profile fields (phone, social links)
-- All columns are nullable TEXT — users can leave them unset.

ALTER TABLE profiles
  ADD COLUMN phone TEXT,
  ADD COLUMN linkedin_url TEXT,
  ADD COLUMN github_url TEXT,
  ADD COLUMN portfolio_url TEXT;
