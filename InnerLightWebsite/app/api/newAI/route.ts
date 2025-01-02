import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { messages, emotion, emotionalContext } = await request.json();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an empathetic AI assistant that adapts its responses based on the user's emotional state. 
                    Current emotional context: ${emotionalContext}
                   Maintain a natural, conversational tone while being mindful of the user's emotional state.
                   Keep responses concise (2-3 sentences) but meaningful.`,
                },
                ...messages,
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        return NextResponse.json({
            response: completion.choices[0].message.content?.trim(),
            emotion,
        });
    } catch (error) {
        console.error("OpenAI request error:", error);
        return NextResponse.json(
            {
                error: "OpenAI request error",
            },
            { status: 500 },
        );
    }
}
