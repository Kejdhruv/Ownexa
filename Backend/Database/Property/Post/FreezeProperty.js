import supabase from "../../SupabaseClient.js";

const FreezeProperty = async (propertyId) => {
  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  const { data: rows, error: fetchError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId);

  if (fetchError) throw fetchError;

  if (!rows || rows.length === 0) {
    throw new Error("Property not found");
  }

  if (rows.length > 1) {
    throw new Error("Multiple properties found — invalid state");
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("properties")
    .update({ is_listed: false })
    .eq("id", propertyId)
    .select();

  if (updateError) throw updateError;

  if (!updatedRows || updatedRows.length !== 1) {
    throw new Error("Property update failed");
  }

  const { data: updatedRows1, error: updateError1 } = await supabase
    .from("holdings")
    .update({ is_listed: false })
    .eq("property_id", propertyId)
    .select();

  if (updateError1) throw updateError1;

  if (!updatedRows1) {
    throw new Error("Holdings update failed");
  }

  return updatedRows[0];
};

export default FreezeProperty;