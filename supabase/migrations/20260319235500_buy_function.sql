-- Function to handle marketplace purchases
CREATE OR REPLACE FUNCTION public.buy_marketplace_item(
  listing_id UUID,
  buyer_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing RECORD;
  seller_profile RECORD;
  buyer_profile RECORD;
BEGIN
  -- Get and lock the listing
  SELECT * INTO listing FROM marketplace_listings 
  WHERE id = listing_id AND status = 'active' FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Listing not found or not active'::TEXT;
    RETURN;
  END IF;
  
  -- Prevent buying own items
  IF listing.seller_id = buyer_id THEN
    RETURN QUERY SELECT false, 'Cannot buy your own listing'::TEXT;
    RETURN;
  END IF;
  
  -- Get buyer profile
  SELECT * INTO buyer_profile FROM profiles WHERE user_id = buyer_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Buyer profile not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check buyer funds
  IF buyer_profile.currency < listing.total_price THEN
    RETURN QUERY SELECT false, 'Insufficient funds'::TEXT;
    RETURN;
  END IF;
  
  -- Get seller profile
  SELECT * INTO seller_profile FROM profiles WHERE user_id = listing.seller_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Seller profile not found'::TEXT;
    RETURN;
  END IF;
  
  -- Update buyer currency
  UPDATE profiles SET currency = currency - listing.total_price WHERE user_id = buyer_id;
  
  -- Update seller currency
  UPDATE profiles SET currency = currency + listing.total_price WHERE user_id = listing.seller_id;
  
  -- Update listing status
  UPDATE marketplace_listings SET status = 'sold', buyer_id = buyer_id WHERE id = listing_id;
  
  -- Add item to buyer's game state
  UPDATE profiles SET 
    game_state = jsonb_set(
      game_state,
      CASE listing.item_type
        WHEN 'ore' THEN '{ores,' || listing.item_id || '}'
        WHEN 'refined' THEN '{refinedOres,' || listing.item_id || '}'
        WHEN 'ingot' THEN '{ingots,' || listing.item_id || '}'
        WHEN 'item' THEN '{items,' || listing.item_id || '}'
      END,
      COALESCE(
        (game_state->CASE listing.item_type
          WHEN 'ore' THEN 'ores'
          WHEN 'refined' THEN 'refinedOres'
          WHEN 'ingot' THEN 'ingots'
          WHEN 'item' THEN 'items'
        END->>listing.item_id)::int,
        0
      ) + listing.quantity
    )
  WHERE user_id = buyer_id;
  
  RETURN QUERY SELECT true, 'Purchase successful'::TEXT;
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.buy_marketplace_item TO authenticated;
