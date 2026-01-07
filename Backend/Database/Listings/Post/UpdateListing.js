import supabase from "../../SupabaseClient.js";

const UpdateListing = async (data, user) => {
  if (!data?.listingId) {
    throw new Error("Listing ID is required");
  }
  if (!user?.id) {
    throw new Error("Authenticated user required");
  }
  const { data: updatedListing, error } = await supabase
    .from("listings") 
    .update({
      buyer_id: user.id,
      transaction_hash: data.transactionHash,
      status: data.status ,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.listingId)
    .select()
    .single() 
   
  if (error) throw error;

  if (!updatedListing) {
    throw new Error("Listing not found or already updated");
  }

  return updatedListing;
};

export default UpdateListing;