import supabase from "../SupabaseClient.js";

const CreateUser = async ({ Email, Password, Username, Role , Avatar}) => {
  const { data, error } = await supabase.auth.signUp({
    email: Email,
    password: Password
  });
  if (error) throw error;
  const { data: user, error: dbError } = await supabase
    .from("users")
    .insert({
      id: data.user.id,
      email: Email,
      username: Username,
      avatar : Avatar , 
      role: Role || "User"
    })
    .select()
    .single();
  if (dbError) throw dbError;
  return user;
};

export default CreateUser;