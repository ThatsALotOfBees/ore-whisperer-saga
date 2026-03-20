
CREATE OR REPLACE FUNCTION public.purchase_marketplace_listing(listing_id uuid, buyer_id uuid)
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
  WHERE id = listing_id AND active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing no longer available');
  END IF;

  -- Prevent self-purchase
  IF v_listing.seller_id = buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own listing');
  END IF;

  v_total_cost := v_listing.price_per_unit * v_listing.quantity;

  -- Deactivate the listing
  UPDATE marketplace_listings SET active = false WHERE id = listing_id;

  -- Credit the seller's profile currency
  UPDATE profiles
  SET currency = COALESCE(currency, 0) + v_total_cost
  WHERE user_id = v_listing.seller_id;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_listing.item_id,
    'item_type', v_listing.item_type,
    'item_name', v_listing.item_name,
    'quantity', v_listing.quantity,
    'total_cost', v_total_cost
  );
END;
$$;
