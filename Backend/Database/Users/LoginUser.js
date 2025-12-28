import supabase from "../SupabaseClient.js";

const LoginUser = async ({ Email, Password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: Email,
    password: Password
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session
  };
};

export default LoginUser;