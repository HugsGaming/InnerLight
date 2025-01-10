// app/api/moderate/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: "No text provided" },
                { status: 400 },
            );
        }

        const moderation = await openai.moderations.create({
            input: text,
        });

        return NextResponse.json(moderation.results[0]);
    } catch (error) {
        console.error("Moderation Error:", error);
        return NextResponse.json(
            { error: "Failed to check content" },
            { status: 500 },
        );
    }
}
