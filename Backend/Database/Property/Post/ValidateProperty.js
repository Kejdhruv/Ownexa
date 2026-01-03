import supabase from "../../SupabaseClient.js";

const ValidateProperty = async (data, adminUser) => {
  if (!data.propertyId) {
    throw new Error("Property ID is required");
  } 
  const { data: property, error } = await supabase
    .from("properties")
    .update({
      launched_price_inr: data.launchedPriceINR,
      price_per_token_inr: data.pricePerTokenINR,

      token_name: data.tokenName,
      initial_token_quantity: data.tokenQuantity,
      token_quantity: data.tokenQuantity,

      is_tokenized: data.tokenization,
      transaction_hash: data.transactionHash,
      blockchain_id: data.blockchainId,

      validated_by: adminUser.id,
      validated_at: new Date(),


      admin_review: data.adminreview,
      status: data.status,
      is_listed: data.listing
    })
    .eq("id", data.propertyId)
    .select()
    .single();

  if (error) throw error;
  return property;
};

export default ValidateProperty; 