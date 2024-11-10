// components/PostList.tsx
"use client";
import React, { useEffect, useState } from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";
import { createClient } from "../utils/supabase/client";
import { getFileExtension } from "../utils/files";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { User } from "@supabase/supabase-js";
import { Tables } from "../../database.types";

export interface Post extends Tables<"posts"> {
    comments: Tables<"comments">[];
    upVotes: Tables<"postUpvotes">[];
    downVotes: Tables<"postDownvotes">[];
    votes?: number;
    user?: Tables<"profiles">;
    image_data?: string | null;
}

export interface NewPost {
    title: string;
    description: string;
    image: File | null | undefined;
    gif: File | null | undefined;
    user_id: string;
}

interface Comment {
    id: number;
    text: string;
    votes: number;
    user: Tables<"profiles">;
}

const PostList: React.FC<{
    user: Tables<"profiles">;
    initialPosts?: Post[] | null;
}> = ({ user, initialPosts }) => {
    const [posts, setPosts] = useState<Post[] | null>([]);
    const supabase = createClient();

    let post: Post;

    const getUser: (
        userId: string,
    ) => Promise<Tables<"profiles"> | null> = async (userId: string) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (error) {
            console.error("Error fetching user:", error);
            return null;
        }
        return data;
    };

    const downloadImage = async (post: Post) => {
        if (post.post_image) {
            const { data: imageBlob, error } = await supabase.storage
                .from("post_images")
                .download(post.post_image);
            if (error) {
                return null;
            }
            console.log(imageBlob);
            const imageObjectURL = URL.createObjectURL(imageBlob);
            return imageObjectURL;
        }
        return null;
    };

    useEffect(() => {
        const fetchPosts = async () => {
            if (!initialPosts) return;

            const postWithData = await Promise.all(
                initialPosts.map(async (post) => {
                    const user = await getUser(post.user_id!);
                    if (user) {
                        console.log(user);
                        const image_data = await downloadImage(post);
                        return {
                            ...post,
                            user,
                            image_data,
                            votes: 0,
                        };
                    }
                    return null;
                }),
            );
            setPosts(postWithData.filter((post) => post !== null));
        };

        fetchPosts();
        console.log(posts);
    }, []);

    const addPost = async (post: NewPost) => {
        // setPosts([post, ...posts]);
        let postImage: string | undefined;
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

    const addComment = (postId: string, comment: Comment) => {
        // setPosts(
        //     posts.map((post) =>
        //         post.id === postId
        //             ? { ...post, comments: [...post.comments, comment] }
        //             : post,
        //     ),
        // );
        console.log("Comment added:", comment);
    };

    const upvotePost = (postId: string) => {
        // setPosts(
        //     posts.map((post) =>
        //         post.id === postId ? { ...post, votes: post.votes + 1 } : post,
        //     ),
        // );
        console.log("Post upvoted:", postId);
    };

    const downvotePost = (postId: string) => {
        // setPosts(
        //     posts.map((post) =>
        //         post.id === postId ? { ...post, votes: post.votes - 1 } : post,
        //     ),
        // );
        console.log("Post downvoted:", postId);
    };

    const editPost = (postId: string) => {
        // Implement the editPost functionality here
        console.log("Edit post:", postId);
    };

    return (
        <div className="container px-6 py-10 mx-auto bg-white dark:bg-gray-700">
            <PostComponent addPost={addPost} user={user} />
            {posts?.length === 0 && <p>No posts found.</p>}
            {posts?.map((post) => (
                <PostItem
                    user={user}
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
