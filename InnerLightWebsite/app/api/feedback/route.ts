import { NextResponse } from "next/server";
import { createClient } from "../../utils/supabase/server";

export async function POST(request: Request) {
    try {
        const { userId, messageId, helpful, comments } = await request.json();

        // Validate required fields
        if (!userId || !messageId || helpful === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Insert feedback into database
        const { error } = await supabase.from('chat_feedback').insert({
            user_id: userId,
            message_id: messageId,
            helpful,
            comments: comments || null
        });

        if (error) {
            throw error;
        }

        // If feedback indicates preference, update user context
        if (!helpful && comments) {
            try {
                // Get existing context
                const { data: contextData } = await supabase
                    .from('user_context')
                    .select('context')
                    .eq('user_id', userId)
                    .single();

                // Update preferences in context
                if (contextData) {
                    // Get existing preferences or initialize empty array
                    // @ts-ignore
                    const preferences = contextData.context.preferences || [];
                    
                    // Add new preference note based on feedback
                    preferences.push(`User indicated dissatisfaction: ${comments}`);
                    
                    // Keep only the most recent 5 preferences
                    const updatedPreferences = preferences.slice(-5);
                    
                    // Update the context
                    const updatedContext = {
                        // @ts-ignore
                        ...contextData.context,
                        preferences: updatedPreferences
                    };
                    
                    await supabase
                        .from('user_context')
                        .update({ context: updatedContext })
                        .eq('user_id', userId);
                } else {
                    // Create new context entry
                    await supabase.from('user_context').insert({
                        user_id: userId,
                        context: {
                            preferences: [`User indicated dissatisfaction: ${comments}`]
                        }
                    });
                }
            } catch (contextError) {
                console.error("Error updating user context:", contextError);
                // Non-critical error, continue without context update
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Feedback submission error:", error);
        return NextResponse.json(
            { error: "Failed to save feedback" },
            { status: 500 }
        );
    }
}