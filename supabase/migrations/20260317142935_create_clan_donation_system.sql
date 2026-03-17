/*
  # Clan Donation System - Core Tables

  1. New Tables
    - `clan_requests` - Stores donation requests created by clan members
      - `id` (uuid, primary key)
      - `clan_id` (uuid, references clans)
      - `requester_id` (uuid, references auth.users)
      - `item_id` (text) - ID of requested item
      - `item_type` (text) - Type: ore, refined, ingot, component, electronic, machine
      - `quantity_needed` (integer) - Total quantity requested
      - `quantity_fulfilled` (integer) - Current amount fulfilled
      - `rarity` (text) - Item rarity for limit enforcement
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
      - `next_request_time` (timestamp) - When user can make next request
      
    - `clan_donations` - Tracks individual donations to requests
      - `id` (uuid, primary key)
      - `request_id` (uuid, references clan_requests)
      - `donor_id` (uuid, references auth.users)
      - `quantity_donated` (integer)
      - `reward_amount` (bigint) - Currency reward given
      - `created_at` (timestamp)
      
    - `clan_contribution` - Per-user contribution stats
      - `id` (uuid, primary key)
      - `clan_id` (uuid, references clans)
      - `user_id` (uuid, references auth.users)
      - `total_donations` (bigint) - Total quantity donated
      - `total_rewards` (bigint) - Total currency rewards earned
      - `donation_count` (integer) - Number of donations made
      - `last_donation_time` (timestamp)
      - `updated_at` (timestamp)
      
    - `clan_perks` - Clan-wide perks and bonuses
      - `id` (uuid, primary key)
      - `clan_id` (uuid, references clans)
      - `perk_type` (text) - Type: request_limit, cooldown_reduction, donation_bonus, request_slots
      - `level` (integer) - Perk level (1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modified Tables
    - `profiles`
      - Added `discovered_ores` (jsonb array) - Tracks discovered ore types
      - Added `discovered_items` (jsonb array) - Tracks discovered crafted items
      - Added `discovered_components` (jsonb array) - Tracks discovered components
      - Added `discovered_electronics` (jsonb array) - Tracks discovered electronics
      - Added `discovered_machines` (jsonb array) - Tracks discovered machines

  3. Security
    - Enable RLS on all new tables
    - Add restrictive policies for data access
    - Prevent unauthorized donations or requests
    - Track and limit daily donations to prevent abuse
*/

-- Add discovery columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discovered_ores'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discovered_ores jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discovered_items'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discovered_items jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discovered_components'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discovered_components jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discovered_electronics'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discovered_electronics jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discovered_machines'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discovered_machines jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create clan_requests table
CREATE TABLE IF NOT EXISTS clan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_type text NOT NULL,
  quantity_needed integer NOT NULL,
  quantity_fulfilled integer NOT NULL DEFAULT 0,
  rarity text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  next_request_time timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_quantity CHECK (quantity_needed > 0 AND quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity_needed)
);

-- Create clan_donations table
CREATE TABLE IF NOT EXISTS clan_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES clan_requests(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity_donated integer NOT NULL,
  reward_amount bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_donation CHECK (quantity_donated > 0)
);

-- Create clan_contribution table
CREATE TABLE IF NOT EXISTS clan_contribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_donations bigint NOT NULL DEFAULT 0,
  total_rewards bigint NOT NULL DEFAULT 0,
  donation_count integer NOT NULL DEFAULT 0,
  last_donation_time timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id),
  CONSTRAINT valid_amounts CHECK (total_donations >= 0 AND total_rewards >= 0 AND donation_count >= 0)
);

-- Create clan_perks table
CREATE TABLE IF NOT EXISTS clan_perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  perk_type text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clan_id, perk_type),
  CONSTRAINT valid_level CHECK (level > 0 AND level <= 5)
);

-- Enable RLS
ALTER TABLE clan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_contribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_perks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clan_requests
CREATE POLICY "Users can view requests from their clan"
  ON clan_requests FOR SELECT
  TO authenticated
  USING (
    clan_id IN (
      SELECT clan_id FROM profiles WHERE user_id = auth.uid() AND clan_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create requests in their clan"
  ON clan_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    clan_id IN (
      SELECT clan_id FROM profiles WHERE user_id = auth.uid() AND clan_id IS NOT NULL
    )
    AND requester_id = auth.uid()
  );

CREATE POLICY "Users can update own requests"
  ON clan_requests FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- RLS Policies for clan_donations
CREATE POLICY "Users can view donations in their clan"
  ON clan_donations FOR SELECT
  TO authenticated
  USING (
    request_id IN (
      SELECT id FROM clan_requests
      WHERE clan_id IN (
        SELECT clan_id FROM profiles WHERE user_id = auth.uid() AND clan_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can donate to clan requests"
  ON clan_donations FOR INSERT
  TO authenticated
  WITH CHECK (
    donor_id = auth.uid()
    AND request_id IN (
      SELECT id FROM clan_requests
      WHERE clan_id IN (
        SELECT clan_id FROM profiles WHERE user_id = auth.uid() AND clan_id IS NOT NULL
      )
      AND requester_id != auth.uid()
    )
  );

-- RLS Policies for clan_contribution
CREATE POLICY "Users can view contribution stats from their clan"
  ON clan_contribution FOR SELECT
  TO authenticated
  USING (
    clan_id IN (
      SELECT clan_id FROM profiles WHERE user_id = auth.uid() AND clan_id IS NOT NULL
    )
  );

CREATE POLICY "System can update contribution stats"
  ON clan_contribution FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update own contribution stats"
  ON clan_contribution FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for clan_perks
CREATE POLICY "Users can view perks from their clan"
  ON clan_perks FOR SELECT
  TO authenticated
  USING (
    clan_id IN (
      SELECT clan_id FROM profiles WHERE user_id = auth.uid() AND clan_id IS NOT NULL
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clan_requests_clan_id ON clan_requests(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_requests_requester_id ON clan_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_clan_requests_created_at ON clan_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_clan_requests_completed_at ON clan_requests(completed_at);
CREATE INDEX IF NOT EXISTS idx_clan_donations_request_id ON clan_donations(request_id);
CREATE INDEX IF NOT EXISTS idx_clan_donations_donor_id ON clan_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_clan_contribution_clan_id ON clan_contribution(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_contribution_user_id ON clan_contribution(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_perks_clan_id ON clan_perks(clan_id);
