
-- Atomic marketplace purchase function
-- Handles: deactivating the listing, so any authenticated buyer can mark it sold.
-- Item delivery and currency deduction are handled client-side in local game state.
-- The seller update policy alone would block buyers, so we use SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.purchase_marketplace_listing(listing_id UUID, buyer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Lock the row to prevent double-purchases
  SELECT * INTO v_listing
  FROM marketplace_listings
  WHERE id = listing_id AND active = true
  FOR UPDATE;

  -- Listing not found or already inactive
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found or already sold');
  END IF;

  -- Buyer cannot purchase their own listing
  IF v_listing.seller_id = buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot purchase your own listing');
  END IF;

  -- Deactivate listing
  UPDATE marketplace_listings
  SET active = false
  WHERE id = listing_id;

  -- Return listing details so client can apply game state changes
  v_result := jsonb_build_object(
    'success', true,
    'item_id', v_listing.item_id,
    'item_type', v_listing.item_type,
    'item_name', v_listing.item_name,
    'quantity', v_listing.quantity,
    'price_per_unit', v_listing.price_per_unit,
    'total_cost', v_listing.price_per_unit * v_listing.quantity,
    'seller_id', v_listing.seller_id
  );

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.purchase_marketplace_listing(UUID, UUID) TO authenticated;

-- Drop the overly restrictive buyer update policy if it exists, since we now use the function
-- (sellers can still update their own listings via the existing policy)
-- No changes needed to existing policies — the function bypasses RLS via SECURITY DEFINER.
