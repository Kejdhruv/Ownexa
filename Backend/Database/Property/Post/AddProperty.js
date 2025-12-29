import supabase from "../../SupabaseClient.js";

const AddProperty = async (data, user) => {
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      owner_email: user.email,
      owner_name: data.ownerName,

      title: data.title,
      bhk: data.bhk,
      property_type: data.propertyType,
      built_up_area_sqft: data.builtUpAreaSqFt,

      address_line: data.addressLine,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || "India",

      registry_name: data.registryName,
      registry_number: data.registryNumber,
      registration_date: data.registrationDate,

      expected_price_inr: data.expectedPriceINR,
      token_name: data.tokenName,

      property_images: data.propertyImages || [],
      legal_documents: data.legalDocuments || [],

      status: "pending"
    })
    .select()
    .single();

  if (error) throw error;
  return property;
}; 


export default AddProperty;