import supabase from "../../SupabaseClient.js";

const PostListing = async (data, user) => {
  // 🔐 AUTH CHECK
  if (!user?.id) {
    throw new Error("Unauthorized: User not found");
  }
  const qty = Number(data.tokenQuantity);
  const price = Number(data.pricePerTokenInr);

  if (!qty || qty <= 0) {
    throw new Error("Invalid token quantity");
  }

  if (!price || price <= 0) {
    throw new Error("Invalid price per token");
  }

  // 🧠 INSERT LISTING
  const { data: listings, error } = await supabase
    .from("listings")
    .insert({
      property_id: data.propertyId,
      seller_id: user.id,
      holding_id: data.holdingId,
      token_quantity: qty,
      price_per_token_inr: price,
      listing_blockchain_id: data.listingBlockchainId,
      buyer_id: null,
      transaction_hash: null,
      status: "ACTIVE",
    })
    .select(); // 🚫 NO .single()

  // ❌ ERROR HANDLING
  if (error) {
    console.error("SUPABASE LISTING INSERT ERROR:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  // ✅ RETURN CREATED LISTING
  return listings?.[0];
};

export default PostListing;