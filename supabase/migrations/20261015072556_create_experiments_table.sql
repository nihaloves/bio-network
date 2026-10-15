/*
# Create experiments table for SPORE-NET 2.0

1. New Tables
- `experiments`
  - `id` (uuid, primary key)
  - `name` (text, optional user-given label)
  - `config` (jsonb, full simulation configuration)
  - `result` (jsonb, full simulation result including both strategies)
  - `algorithm_version` (text, version of the simulation engine)
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `experiments`.
- This is a public demo without user accounts. All experiments are shared/public.
- Allow anon + authenticated CRUD using `TO anon, authenticated` with `USING (true)`.
- Documented limitation: any visitor can delete any experiment. This is intentional
  for a public hackathon demo; a production deployment would add authentication.
3. Indexes
- `idx_experiments_created_at` for listing by date
*/

CREATE TABLE IF NOT EXISTS experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  config jsonb NOT NULL,
  result jsonb NOT NULL,
  algorithm_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_experiments" ON experiments;
CREATE POLICY "anon_select_experiments" ON experiments FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_experiments" ON experiments;
CREATE POLICY "anon_insert_experiments" ON experiments FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_experiments" ON experiments;
CREATE POLICY "anon_update_experiments" ON experiments FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_experiments" ON experiments;
CREATE POLICY "anon_delete_experiments" ON experiments FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments (created_at DESC);
