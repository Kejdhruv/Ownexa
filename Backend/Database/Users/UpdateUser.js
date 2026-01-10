import supabase from "../SupabaseClient.js";

const UpdateUser = async (email, role) => {

  const allowedRoles = ["Admin", "User"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("email", email)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export default UpdateUser;