import supabase from "../../SupabaseClient.js";

// For Property 
const FindPropertyListing = async (status, propertyId) => {
  if (status === undefined || propertyId === undefined) {
    throw new Error("Status and propertyId flag are required");
  }
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id ,
      token_quantity ,
      price_per_token_inr , 
      status , 
      seller_id , 
      listing_blockchain_id ,
      created_at , 
      properties (
        id,
        blockchain_id,
        status,
        is_listed
      )`)
    .eq("status", status)
    .eq("property_id", propertyId)

  if (error) throw error;
  return data;
};

// All Listings 
const FindListings = async (status) => {
  if (status === undefined) {
    throw new Error("Status is not defined");
  }
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id ,
      token_quantity ,
      price_per_token_inr , 
      status , 
      seller_id , 
      created_at , 
      properties (
        id,
        title,
        city,
        state,
        token_name,
        blockchain_id,
        property_images,
        status,
        is_listed
      )`)
    .eq("status", status)

  if (error) throw error;
  return data;
};

// For Seller 
const FindingSellerListing = async (userId, status) => {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id ,
      token_quantity,
      price_per_token_inr ,
      created_at,
      status,
      properties (
      title ,
      city,
      state,
      token_name) ,
      holdings (
      avg_price_inr )`)
    .eq("seller_id", userId).eq("status", status).order("updated_at", { ascending: true });

  if (error) throw error;
  return data;
};

// For Buyer 
const FindingBuyerListing = async (userId, status) => {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("buyer_id", userId).eq("status", status).order("updated_at", { ascending: true });

  if (error) throw error;
  return data;
};


export { FindPropertyListing, FindingBuyerListing, FindingSellerListing, FindListings };