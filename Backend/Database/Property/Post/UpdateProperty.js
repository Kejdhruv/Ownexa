import supabase from "../../SupabaseClient.js";

const UpdateProperty = async (data) => {
  if (!data.propertyId || !data.tokenQuantity) {
    throw new Error("Property ID and token quantity are required");
  }

  const { data: rows, error: fetchError } = await supabase
    .from("properties")
    .select("token_quantity")
    .eq("id", data.propertyId);

  if (fetchError) throw fetchError;

  if (!rows || rows.length === 0) {
    throw new Error("Property not found");
  }

  if (rows.length > 1) {
    throw new Error("Multiple properties found — invalid state");
  }

  const currentQuantity = Number(rows[0].token_quantity);
  const buyQty = Number(data.tokenQuantity);

  if (Number.isNaN(currentQuantity) || Number.isNaN(buyQty)) {
    throw new Error("Invalid token quantity");
  }

  const newQuantity = currentQuantity - buyQty;

  if (newQuantity < 0) {
    throw new Error("Insufficient property token supply");
  }
  const { data: updatedRows, error: updateError } = await supabase
    .from("properties")
    .update({ token_quantity: newQuantity })
    .eq("id", data.propertyId)
    .select();

  if (updateError) throw updateError;

  if (!updatedRows || updatedRows.length !== 1) {
    throw new Error("Property update failed");
  }

  return updatedRows[0];
};

export default UpdateProperty;