import supabase from "../SupabaseClient.js";

const CreateUser = async ({ Email, Password, Username, Role, Avatar , Age , AnnualIncome , InvestmentAmount, Duration }) => {
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
      avatar: Avatar,
      role: Role || "User", 
      age: Age, 
      annual_income: AnnualIncome, 
      investment_amount: InvestmentAmount, 
      investment_duration : Duration 
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return user;
};

export default CreateUser;