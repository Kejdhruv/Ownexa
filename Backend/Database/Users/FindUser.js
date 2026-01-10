import supabase from "../SupabaseClient.js";

const FindUser = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select(" email, username , created_at , avatar , role ")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
};


const FindAllUser = async () => {
  const { data, error } = await supabase
    .from("users")
    .select(" email, username , created_at , role "); 

  if (error) throw error;

  return data;
};


export default {FindAllUser , FindUser} 