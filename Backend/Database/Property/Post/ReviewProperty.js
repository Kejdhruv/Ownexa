import supabase from "../../SupabaseClient.js";

const WarnProperty = async (data) => {
  if (!data?.propertyId) throw new Error("Property ID is required");

  const { data: property, error } = await supabase
    .from("properties")
    .update({
      updated_at: new Date().toISOString(),
      admin_review: data.adminreview ?? null,
    })
    .eq("id", data.propertyId)
    .select()
    .single();

  if (error) throw error;
  return property;
};

const FreezePropertyAdmin = async (data) => {
  if (!data?.propertyId) throw new Error("Property ID is required");

  const { data: property, error } = await supabase
    .from("properties")
    .update({
      updated_at: new Date().toISOString(),
      admin_review: data.adminreview ?? null,
      status: "FROZEN",
      is_listed: false,
    })
    .eq("id", data.propertyId)
    .select()
    .single();

  if (error) throw error;
  return property;
};

export { WarnProperty, FreezePropertyAdmin };