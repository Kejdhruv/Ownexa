import supabase from "../SupabaseClient.js";

export const FindUser = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("email, username, created_at, avatar, role , risk_label")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};
