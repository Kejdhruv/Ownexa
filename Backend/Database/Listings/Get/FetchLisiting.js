import supabase from "../../SupabaseClient.js";

// For Property 
const FindPropertyListing = async (status, propertyId) => {
  if (status === undefined || propertyId === undefined) {
    throw new Error("Status and propertyId flag are required");
  }
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", status)
    .eq("property_id", propertyId)

  if (error) throw error;
  return data;
}; 

// For Seller 
const FindingSellerListing = async (userId , status ) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", userId).eq("status" , status).order("updated_at", { ascending: true });
    
  if (error) throw error;
  return data;
}; 

// For Buyer 
const FindingBuyerListing = async (userId , status ) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("buyer_id", userId).eq("status" , status).order("updated_at", { ascending: true });
    
  if (error) throw error;
  return data;
}; 
 

export { FindPropertyListing, FindingBuyerListing  , FindingSellerListing};