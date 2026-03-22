
CREATE OR REPLACE FUNCTION public.purchase_marketplace_listing(listing_id uuid, buyer_id uuid, buy_quantity integer DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_qty integer;
  v_total_cost bigint;
  v_remaining integer;
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

  -- Determine quantity to buy
  v_qty := COALESCE(buy_quantity, v_listing.quantity);
  IF v_qty < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity');
  END IF;
  IF v_qty > v_listing.quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough quantity available');
  END IF;

  v_total_cost := v_listing.price_per_unit * v_qty;
  v_remaining := v_listing.quantity - v_qty;

  -- Update or deactivate the listing
  IF v_remaining = 0 THEN
    UPDATE marketplace_listings SET active = false WHERE id = listing_id;
  ELSE
    UPDATE marketplace_listings SET quantity = v_remaining WHERE id = listing_id;
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
    'quantity', v_qty,
    'total_cost', v_total_cost
  );
END;
$function$;
