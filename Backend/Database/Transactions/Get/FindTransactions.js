import supabase from "../../SupabaseClient.js";

const FindTransactions = async (status, user) => {
  if (!status || !user?.id) {
    throw new Error("Status and authenticated user are required");
  }
  const { data, error } = await supabase
    .from("primary_transactions")
    .select(`
      id,
      token_quantity,
      token_name,
      price_per_token_inr,
      transaction_hash,
      status,
      created_at,
      properties (
        id,
        title,
        city,
        state,
        blockchain_id,
        property_images, 
        status , 
        is_listed 
      )
    `)
    .eq("status", status)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};






export default FindTransactions;