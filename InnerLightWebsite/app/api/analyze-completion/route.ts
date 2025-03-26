import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment variables
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { responses } = body;

        if (!responses) {
            return NextResponse.json({ error: "Responses are required" }, { status: 400 });
        }

        console.log("Received responses:", responses);

        const prompt = `
            Analyze the following responses and provide a short paragraph summarizing the user's emotional state, thought patterns, and any notable insights:
            ${JSON.stringify(responses, null, 2)}
        `;

        console.log("Generated prompt:", prompt);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an assistant that analyzes user responses." },
                { role: "user", content: prompt }
            ],
            max_tokens: 150,
        });

        console.log("OpenAI API response:", completion);

        if (!completion || !completion.choices || !completion.choices[0]?.message?.content) {
            console.error("Invalid OpenAI API response:", completion);
            return NextResponse.json({ error: "Invalid response from OpenAI API" }, { status: 500 });
        }

        const analysis = completion.choices[0].message.content.trim();
        return NextResponse.json({ analysis });
    } catch (error: any) {
        console.error("Error with OpenAI API:", error.response?.data || error.message || error);
        return NextResponse.json(
            {
                error: "Failed to analyze responses",
                details: error.response?.data || error.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}