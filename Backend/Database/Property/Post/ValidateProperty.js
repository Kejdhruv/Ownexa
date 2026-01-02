import supabase from "../../SupabaseClient.js";

const ValidateProperty = async (data, adminUser) => {
  if (!data.transactionHash) {
    throw new Error("Minting not confirmed on blockchain");
  }
  if (!data.priceINR || !data.tokenQuantity) {
    throw new Error("Invalid token economics");
  }

  const pricePerTokenINR = Math.floor(
    data.priceINR / data.tokenQuantity
  );

  const { data: property, error } = await supabase
    .from("properties")
    .update({
      launched_price_inr: data.priceINR,
      price_per_token_inr: pricePerTokenINR,

      token_name: data.tokenName,
      initial_token_quantity: data.tokenQuantity,
      token_quantity: data.tokenQuantity,

      is_tokenized: true,
      transaction_hash: data.transactionHash,
      blochainchain_id : data.BlochainchainId , 

      validated_by: adminUser.id,
      validated_at: new Date(),

      status: "validated",
      is_listed: true
    })
    .eq("id", data.propertyId)
    .select()
    .single();

  if (error) throw error;
  return property;
}; 

export default ValidateProperty; 