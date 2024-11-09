// components/PostList.tsx
"use client";
import React, { useState } from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";
import { createClient } from "../utils/supabase/client";
import { getFileExtension } from "../utils/files";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { User } from "@supabase/supabase-js";
import {Tables} from '../../database.types'

interface Post {
    id: number;
    title: string;
    description: string;
    votes: number;
    comments: Comment[];
    image?: string | File;
    gif?: string | File;
    user: Tables<'profiles'>;
}

interface Comment {
    id: number;
    text: string;
    votes: number;
    user: Tables<'profiles'>;
}

const PostList: React.FC<{
    user: Tables<'profiles'>;
}> = ({ user }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const supabase = createClient();

    const addPost = async (post: Post) => {
        // setPosts([post, ...posts]);
        let postImage : string | undefined;
        const imageFile = post.image as File;
        if (imageFile) {
            const extension = getFileExtension(imageFile.name);
            const { data: imageData, error: imageDataError } =
                await supabase.storage
                    .from("post_images")
                    .upload(`post_images/${uuidv4()}.${extension}`, imageFile);
            if (imageDataError) {
                toast.error(imageDataError.message, { position: "top-right" });
                return;
            }

            console.log(imageData);

            postImage = imageData.path;
        }

        const { data: postData, error: postError } = await supabase
            .from("posts")
            .insert({
                title: post.title,
                content: post.description,
                post_image: postImage,
                user_id: user!.id,
            });
        if (postData) {
            toast.success("Post added successfully", { position: "top-right" });
            return;
        }
        if (postError) {
            toast.error(postError.message, { position: "top-right" });
            return;
        }
    };

    const addComment = (postId: number, comment: Comment) => {
        // setPosts(
        //     posts.map((post) =>
        //         post.id === postId
        //             ? { ...post, comments: [...post.comments, comment] }
        //             : post,
        //     ),
        // );
        console.log("Comment added:", comment);
    };

    const upvotePost = (postId: number) => {
        // setPosts(
        //     posts.map((post) =>
        //         post.id === postId ? { ...post, votes: post.votes + 1 } : post,
        //     ),
        // );
        console.log("Post upvoted:", postId);
    };

    const downvotePost = (postId: number) => {
        // setPosts(
        //     posts.map((post) =>
        //         post.id === postId ? { ...post, votes: post.votes - 1 } : post,
        //     ),
        // );
        console.log("Post downvoted:", postId);
    };

    const editPost = (postId: number) => {
        // Implement the editPost functionality here
        console.log("Edit post:", postId);
    };

    return (
        <div className="container px-6 py-10 mx-auto bg-white dark:bg-gray-700">
            <PostComponent addPost={addPost} user={user} />
            {posts.map((post) => (
                <PostItem
                    key={post.id}
                    post={post}
                    addComment={addComment}
                    upvotePost={upvotePost}
                    downvotePost={downvotePost}
                    editPost={editPost}
                />
            ))}
        </div>
    );
};

export default PostList;
