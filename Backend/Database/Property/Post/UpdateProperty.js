import supabase from "../../SupabaseClient.js";

const UpdateProperty = async (data) => {
  if (!data.propertyId || !data.tokenQuantity) {
    throw new Error("Property ID and token quantity are required");
  }

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("token_quantity")
    .eq("id", data.propertyId)
    .single();

  if (fetchError) throw fetchError;

  const newQuantity = property.token_quantity - Number(data.tokenQuantity);

  if (newQuantity < 0) {
    throw new Error("Insufficient property token supply");
  }

  const { data: updatedProperty, error: updateError } = await supabase
    .from("properties")
    .update({
      token_quantity: newQuantity
    })
    .eq("id", data.propertyId)
    .select()
    .single();

  if (updateError) throw updateError;

  return updatedProperty;
};

export default UpdateProperty;