import  supabase from "../Database/SupabaseClient.js"

const getAuthUser = async (req) => {
  const token = req.cookies?.Ownexa_Token;
  if (!token) throw new Error("Unauthorized");

  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;

  return data.user;
};  

export default getAuthUser; 