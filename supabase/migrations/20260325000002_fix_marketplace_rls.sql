-- Fix marketplace_listings RLS policies to allow sellers to manage their own listings.
-- The previous SELECT policy blocked sellers from seeing their own inactive listings,
-- which could cause 403/404 errors during deactivation (cancellation).

-- 1. Broaden SELECT policy so users can see active listings OR their own listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
CREATE POLICY "Anyone can view active listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (active = true OR auth.uid() = seller_id);

-- 2. Ensure UPDATE policy has both USING and WITH CHECK for clarity
DROP POLICY IF EXISTS "Users can update own listings" ON public.marketplace_listings;
CREATE POLICY "Users can update own listings"
  ON public.marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 3. Ensure DELETE policy is robust
DROP POLICY IF EXISTS "Users can delete own listings" ON public.marketplace_listings;
CREATE POLICY "Users can delete own listings"
  ON public.marketplace_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);
