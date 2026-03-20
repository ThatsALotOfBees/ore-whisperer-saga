
-- Update purchase_marketplace_listing to support partial purchases
-- Drops the old 2-argument version and replaces it with a 3-argument version (id, buyer_id, quantity)

DROP FUNCTION IF EXISTS public.purchase_marketplace_listing(uuid, uuid);

CREATE OR REPLACE FUNCTION public.purchase_marketplace_listing(p_listing_id uuid, p_buyer_id uuid, p_quantity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_total_cost bigint;
BEGIN
  -- Lock and fetch the listing
  SELECT * INTO v_listing
  FROM marketplace_listings
  WHERE id = p_listing_id AND active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing no longer available');
  END IF;

  -- Prevent self-purchase
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own listing');
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 OR p_quantity > v_listing.quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity requested');
  END IF;

  v_total_cost := v_listing.price_per_unit * p_quantity;

  -- Update or deactivate the listing
  IF p_quantity = v_listing.quantity THEN
    UPDATE marketplace_listings 
    SET active = false, quantity = 0 
    WHERE id = p_listing_id;
  ELSE
    UPDATE marketplace_listings 
    SET quantity = quantity - p_quantity 
    WHERE id = p_listing_id;
  END IF;

  -- Credit the seller's profile currency
  UPDATE profiles
  SET currency = COALESCE(currency, 0) + v_total_cost
  WHERE user_id = v_listing.seller_id;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_listing.item_id,
    'item_type', v_listing.item_type,
    'item_name', v_listing.item_name,
    'quantity', p_quantity,
    'total_cost', v_total_cost,
    'price_per_unit', v_listing.price_per_unit
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.purchase_marketplace_listing(uuid, uuid, integer) TO authenticated;
