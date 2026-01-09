import supabase from "../../SupabaseClient.js";

const Holdings = async (data, user) => {
  if (!user?.id) {
    throw new Error("Unauthorized: User not found");
  }

  const {
    propertyId,
    tokenQuantity,
    pricePerTokenInr,
    accountaddress,
  } = data;

  const wallet = accountaddress.toLowerCase();
  const buyQty = Number(tokenQuantity);
  const buyPrice = Number(pricePerTokenInr);

  // 1️⃣ Read existing holding (may or may not exist)
  const { data: holding, error: fetchError } = await supabase
    .from("holdings")
    .select("token_quantity, avg_price_inr")
    .eq("wallet_address", wallet)
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // 2️⃣ Calculate new qty + weighted avg
  const oldQty = holding?.token_quantity || 0;
  const oldAvg = holding?.avg_price_inr || 0;

  const newQty = oldQty + buyQty;
  const newAvg =
    (oldQty * oldAvg + buyQty * buyPrice) / newQty;

  // 3️⃣ UPSERT (guarantees single row)
  const { error: upsertError } = await supabase
    .from("holdings")
    .upsert(
      {
        user_id: user.id,
        wallet_address: wallet,
        property_id: propertyId,
        token_quantity: newQty,
        avg_price_inr: newAvg,
        holding_status: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "wallet_address,property_id",
      }
    );

  if (upsertError) throw upsertError;

  return {
    type: holding ? "UPDATED" : "CREATED",
    newQty,
    newAvg,
  };
};

export default Holdings;