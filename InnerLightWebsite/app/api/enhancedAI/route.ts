// app/api/enhancedAI/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "../../utils/supabase/server";
import { encryptedAdaptiveLearningModule } from "../../utils/adaptiveLearning/AdaptiveLearningModule";
import { userEmotionalContextModule } from "../../utils/mentalHealth/UserEmotionalContextModule";
import { EncryptionManager } from "../../utils/encryption/client";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { 
            messages, 
            emotion, 
            sessionId,
            emotionHistory = [] 
        } = await request.json();

        // Get user profile for context
        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (!profileData) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        // Get enhanced emotional context
        const emotionalContext = await userEmotionalContextModule.generateEmotionalContext(
            user.id,
            emotion || "neutral",
            messages[messages.length - 1].content,
            emotionHistory
        );

        // Prepare the system message with enhanced context
        const systemMessage = {
            role: "system",
            content: `You are an empathetic AI companion that adapts its responses based on the user's emotional state.
            
Current user: ${profileData.username || "User"}
Current emotional context: ${emotionalContext.customPrompt}

${emotionalContext.professionalConsiderations ? 
  `Important considerations: ${emotionalContext.professionalConsiderations.join(' ')}` : ''}

Maintain a natural, conversational tone while being mindful of the user's emotional state.
Keep responses concise (2-3 sentences) but meaningful and supportive.
Do not diagnose or provide medical/clinical advice.
Focus on being a supportive companion using this approach: ${emotionalContext.suggestedApproach}`
        };

        // Send to OpenAI with the enhanced system message
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                systemMessage,
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        const responseContent = completion.choices[0].message.content?.trim() || "";

        // Record the interaction for adaptive learning with encryption
        await encryptedAdaptiveLearningModule.recordInteraction({
            userId: user.id,
            message: messages[messages.length - 1].content,
            detectedEmotion: emotion || "neutral",
            responseEmotion: "supportive", // Simplified
            timestamp: new Date().toISOString(),
            sessionId: sessionId || new Date().toISOString(),
            contextualTags: []
        });

        return NextResponse.json({
            response: responseContent,
            emotion,
            contextUsed: emotionalContext.suggestedApproach,
        });
    } catch (error) {
        console.error("Enhanced AI request error:", error);
        return NextResponse.json(
            {
                error: "Enhanced AI request error",
            },
            { status: 500 }
        );
    }
}

// API route for recording user feedback about AI responses
export async function PUT(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { interactionId, feedbackScore } = await request.json();
        
        if (!interactionId || typeof feedbackScore !== 'number') {
            return NextResponse.json({ error: "Invalid feedback data" }, { status: 400 });
        }

        // Record feedback for adaptive learning with encryption
        await encryptedAdaptiveLearningModule.recordFeedback(
            user.id,
            interactionId,
            feedbackScore
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Feedback submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}