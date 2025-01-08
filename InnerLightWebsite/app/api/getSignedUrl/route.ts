import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = createClient();
    try {
        const { path, bucket } = await request.json();

        if (!path) {
            return NextResponse.json(
                { error: "No path provided" },
                { status: 400 },
            );
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);

        if (error) throw error;

        return NextResponse.json({
            signedUrl: data.signedUrl,
        });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json(
            { error: "Failed to generate signed URL" },
            { status: 500 },
        );
    }
}
