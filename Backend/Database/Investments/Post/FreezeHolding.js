import supabase from "../../SupabaseClient.js";

const FreezeHolding = async (holdingId, userId) => {

    // Validation
    if (!holdingId) {
        throw new Error("Holding ID is required");
    }

    if (!userId) {
        throw new Error("User ID is required");
    }

    // 1️⃣ Fetch holding (verify ownership)
    const { data: holding, error: fetchError } = await supabase
        .from("holdings")
        .select("*")
        .eq("id", holdingId)
        .eq("user_id", userId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (!holding) {
        throw new Error("Holding not found or unauthorized");
    }

    // Prevent double redeem
    if (holding.redeemed === true) {
        throw new Error("Holding already redeemed");
    }

    // 2️⃣ Update holding (mark redeemed + disable)
    const { data: disabledHolding, error: disableError } = await supabase
        .from("holdings")
        .update({
            redeemed: true,
            holding_status: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", holdingId)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

    if (disableError) throw disableError;

    if (!disabledHolding) {
        throw new Error("Failed to update holding");
    }

    // 3️⃣ Return result
    return {
        type: "REDEEMED",
        holdingId: disabledHolding.id,
        propertyId: disabledHolding.property_id,
        userId: disabledHolding.user_id,
    };
};

export default FreezeHolding;