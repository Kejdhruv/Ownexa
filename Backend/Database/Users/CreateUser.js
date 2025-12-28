import supabase from "../SupabaseClient";

const CreateUser = async (newUser) => {
  const { Email, Password, Username, Role } = newUser;

  const { data, error } = await supabase.auth.signUp({
    email: Email,
    password: Password
  });

  if (error) {
    throw new Error(error.message);
  }
  const { data: user, error: dbError } = await supabase
    .from("users")
    .insert([
      {
        id: data.user.id,
        email: Email,
        username: Username,
        role: Role || "User"
      }
    ])
    .select()
    .single();

  if (dbError) {
    throw new Error(dbError.message);
  }
  return user;
};

export default CreateUser;