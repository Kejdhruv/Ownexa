import supabase from "../../SupabaseClient.js";

const PostListing = async (data, user) => {
  if (!user?.id) {
    throw new Error("Unauthorized: User not found");
  }  
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      property_id: data.propertyId,
      seller_id: user.id,
      holding_id: data.holdingId, 
      token_quantity: data.tokenQuantity,
      price_per_token_inr: data.pricePerTokenInr,
      listing_blockchain_id: data.blockchainId, 
      buyer_id: null, 
      transaction_hash : null , 
      status: data.status , 
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return listing;
};

export default PostListing; 