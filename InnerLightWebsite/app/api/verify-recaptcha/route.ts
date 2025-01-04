import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();
        const verificationResponse = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_KEY}&response=${token}`,
            {
                method: "POST",
            },
        );

        const verificationData = await verificationResponse.json();

        return NextResponse.json({
            success: verificationData.success,
            score: verificationData.score,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to verif recaptcha",
            },
            { status: 500 },
        );
    }
}
