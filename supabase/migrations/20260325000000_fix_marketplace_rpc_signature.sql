-- Migration to rename and align marketplace RPC with frontend expectations
-- This fixes the "404 Not Found" / "Function not found in schema cache" error by providing 
-- the 'buy_marketplace_item' function with the exact parameter names used in the codebase.

CREATE OR REPLACE FUNCTION public.buy_marketplace_item(
    p_listing_id UUID,
    p_buyer_id UUID,
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_total_cost bigint;
  v_remaining integer;
BEGIN
  -- 1. Lock and fetch the listing to prevent race conditions
  SELECT * INTO v_listing
  FROM marketplace_listings
  WHERE id = p_listing_id AND active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing no longer available');
  END IF;

  -- 2. Prevent self-purchase
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own listing');
  END IF;

  -- 3. Validate quantity
  IF p_quantity < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity');
  END IF;
  
  IF p_quantity > v_listing.quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough quantity available');
  END IF;

  v_total_cost := v_listing.price_per_unit * p_quantity;
  v_remaining := v_listing.quantity - p_quantity;

  -- 4. Update or deactivate the listing
  IF v_remaining = 0 THEN
    UPDATE marketplace_listings SET active = false, quantity = 0 WHERE id = p_listing_id;
  ELSE
    UPDATE marketplace_listings SET quantity = v_remaining WHERE id = p_listing_id;
  END IF;

  -- 5. Credit the seller
  UPDATE profiles
  SET currency = COALESCE(currency, 0) + v_total_cost
  WHERE user_id = v_listing.seller_id;

  -- 6. Return transaction details for game state update
  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_listing.item_id,
    'item_type', v_listing.item_type,
    'item_name', v_listing.item_name,
    'quantity', p_quantity,
    'total_cost', v_total_cost,
    'seller_id', v_listing.seller_id
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.buy_marketplace_item(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_marketplace_item(UUID, UUID, INTEGER) TO service_role;
