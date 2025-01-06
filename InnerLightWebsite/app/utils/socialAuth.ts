import { createClient } from "./supabase/client";

const getRedirectUrl = () => {
    // Check if we're in development or production
    const isDevelopment = process.env.NODE_ENV === "development";
    const baserUrl = isDevelopment
        ? "http://localhost:3000"
        : "https://www.innerlight.icu";

    return `${baserUrl}/auth/callback`;
};

export async function handleSocialLogin(provider: "google" | "facebook") {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error("Error during social login:", error);
        return { data: null, error };
    }
}

export async function handleAuthCallback() {
    const supabase = createClient();

    try {
        // Get user data after OAuth callback
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not found");

        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        // Only create profile if it doesn't exist
        if (!existingProfile) {
            const metadata = user.user_metadata;
            const firstName =
                metadata?.full_name?.split(" ")[0] ||
                metadata?.first_name ||
                "";
            const lastName =
                metadata?.full_name?.split(" ").slice(1).join(" ") ||
                metadata?.last_name ||
                "";
            const username =
                metadata?.username ||
                metadata?.preferred_username ||
                `${firstName}_${lastName}@${user.id}`;

            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id ?? "",
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    email: user.email!,
                    avatar_url: metadata?.avatar_url || metadata?.picture,
                });

            if (profileError) throw profileError;

            // Create registration audit log
            const { error: logError } = await supabase
                .from("auditLogs")
                .insert({
                    user_id: user.id,
                    action_type: "Registration",
                    add_info: {
                        provider: metadata?.provider,
                    },
                });

            if (logError) throw logError;
        }
        return { user, error: null };
    } catch (error) {
        console.error("Error during auth callback:", error);
        return { user: null, error };
    }
}
