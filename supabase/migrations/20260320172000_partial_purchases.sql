
-- Fix for "Could not find function" schema cache error by renaming
DROP FUNCTION IF EXISTS public.buy_marketplace_item(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.buy_marketplace_item(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_quantity integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing record;
  v_total_price bigint;
BEGIN
  -- 1. Get and lock listing
  SELECT * FROM marketplace_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE INTO v_listing;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Listing not found or no longer active');
  END IF;

  -- 2. Validate quantity
  IF p_quantity <= 0 OR p_quantity > v_listing.quantity THEN
    RETURN json_build_object('success', false, 'error', 'Invalid quantity');
  END IF;

  -- 3. Prevent self-purchase
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot buy your own listing');
  END IF;

  v_total_price := v_listing.price_per_unit * p_quantity;

  -- 4. Check buyer balance
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_buyer_id AND currency >= v_total_price) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- 5. Atomic Tranfer
  -- Deduct from buyer
  UPDATE profiles SET currency = currency - v_total_price WHERE id = p_buyer_id;
  -- Add to seller
  UPDATE profiles SET currency = currency + v_total_price WHERE id = v_listing.seller_id;

  -- 6. Update or Delete listing
  IF v_listing.quantity = p_quantity THEN
    UPDATE marketplace_listings SET status = 'sold', buyer_id = p_buyer_id, updated_at = now() WHERE id = p_listing_id;
  ELSE
    'quantity', p_quantity,
    'total_cost', v_total_cost,
    'price_per_unit', v_listing.price_per_unit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_marketplace_listing(uuid, uuid, integer) TO authenticated;
