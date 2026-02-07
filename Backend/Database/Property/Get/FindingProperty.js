import supabase from "../../SupabaseClient.js";

const FindProperty = async (status, listing) => {
  if (status === undefined || listing === undefined) {
    throw new Error("Status and listing flag are required");
  }
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", status)
    .eq("is_listed", listing)
    .order("validated_at", { ascending: false });

  if (error) throw error;
  return data;
};

const FindOneProperty = async (propertyId, status, listing) => {
  if (!propertyId || status === undefined || listing === undefined) {
    throw new Error("Invalid property query");
  }
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("status", status)
    .eq("is_listed", listing)
    .single();

  if (error) throw error;
  return data;
};


const FindingProperties = async (userId) => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", userId)

  if (error) throw error;
  return data;
};


const FindValidatedStaleProperties = async (days = 2) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "Validated")
    .or(`last_doc_uploaded_at.lt.${cutoff},last_doc_uploaded_at.is.null`)
    .order("last_doc_uploaded_at", { ascending: true, nullsFirst: true });

  if (error) throw error;
  return data;
};
export { FindProperty, FindOneProperty, FindingProperties, FindValidatedStaleProperties };