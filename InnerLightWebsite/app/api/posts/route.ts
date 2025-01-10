import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    const supabase = createClient();

    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Get the request data
        const formData = await request.formData();
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const image = formData.get("image") as File;

        if (!title || !description || !image) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Upload the image to Supabase
        const imageExt = image.name.split(".").pop();
        const imagePath = `post_images/${uuidv4()}.${imageExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("post_images")
            .upload(imagePath, image, {
                contentType: image.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Error uploading image:", uploadError);
            return NextResponse.json(
                { error: "Error uploading image" },
                { status: 500 },
            );
        }

        // Create the post in the database
        const { data: post, error: postError } = await supabase
            .from("posts")
            .insert({
                title,
                content: description,
                post_image: imagePath,
                user_id: session.user.id,
            })
            .select("*, user:profiles(*)")
            .single();

        if (postError) {
            await supabase.storage.from("post_images").remove([imagePath]);
            console.error("Error creating post:", postError);
            return NextResponse.json(
                { error: "Error creating post" },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                message: "Post created successfully",
                post,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
