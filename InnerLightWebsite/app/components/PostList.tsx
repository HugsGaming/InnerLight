// components/PostList.tsx
"use client";
import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";
import { createClient } from "../utils/supabase/client";
import { getFileExtension } from "../utils/files";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Tables } from "../../database.types";

export interface Post extends Tables<"posts"> {
    comments?: Tables<"comments">[];
    upVotes?: Tables<"postUpvotes">[];
    downVotes?: Tables<"postDownvotes">[];
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

export interface NewComment {
    text: string;
    post_id: string;
    user_id: string;
    votes: number;
}

export interface Comment extends Tables<"comments"> {
    user?: Tables<"profiles"> | null;
    votes?: number;
    upVotes?: Tables<"commentUpvote">[];
    downVotes?: Tables<"commentDownVote">[];
}

const PostList: React.FC<{
    user: Tables<"profiles">;
    initialPosts?: Post[] | null;
}> = ({ user, initialPosts }) => {
    const [posts, setPosts] = useState<(Post | null)[]>([]);
    const supabase = useMemo(() => createClient(), []);

    const getUser: (
        userId: string,
    ) => Promise<Tables<"profiles"> | null> = useCallback(async (userId: string) => {
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
    }, [supabase]);

    const downloadImage = useCallback(async (post: Post) => {
        if(!post.post_image) return null;

        try {
            const { data, error } = await supabase.storage
                .from("post_images")
                .download(post.post_image);

            if (error) {
                toast.error(error.message, { position: "top-right" });
                return null;
            }

            return URL.createObjectURL(data);
        } catch (error) {
            toast.error("Error downloading image", { position: "top-right" });
            return null;
        }
    }, [supabase]);

    const processPost = useCallback(async (post: Post) => {
        const user = await getUser(post.user_id!);
        if(!user) return null;

        const image_data = await downloadImage(post);
        return {
            ...post,
            user,
            image_data,
            votes: 0
        }

    }, [getUser, downloadImage])

    useEffect(() => {
        const fetchPosts = async () => {
            if (!initialPosts?.length) return;

            const postWithData = await Promise.all(
                initialPosts.map(processPost)
            );
            setPosts(postWithData.filter((post) => post !== null));
        };

        fetchPosts();
        console.log(posts);
    }, [initialPosts, processPost]);

    useEffect(() => {
        const channel = supabase
            .channel("realtime_posts")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "posts" },
                async (payload) => {
                    const newPostData = payload.new as Post;
                    const processedPost = await processPost(newPostData);

                    if (processedPost) {
                        setPosts((prevPosts) => [processedPost, ...(prevPosts ?? [])]);
                    }
                },
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [supabase, processPost]);

    // useEffect(() => {
    //     const channel = supabase
    //         .channel("realtime_comments")
    //         .on(
    //             "postgres_changes",
    //             { event: "INSERT", schema: "public", table: "comments" },
    //             async (payload) => {
    //                 const newComment = payload.new as Comment;
    //                 // setPosts((prevPosts) =>
    //                 //     prevPosts.map((post) => {
    //                 //         if (post?.id === newComment.post_id) {
    //                 //             return {
    //                 //                 ...post,
    //                 //                 comments: [...(post.comments ?? []), newComment],
    //                 //             };
    //                 //         }
    //                 //         return post;
    //                 //     })
    //                 // );
    //                 console.log("Comment added:", newComment);
    //             },
    //         )
    //         .subscribe();

    //     return () => {
    //         channel.unsubscribe();
    //     };
    // }, [supabase]);

    const addPost = useCallback(async (post: NewPost) => {
        try {
            let postImage: string | undefined;

            if(post.image) {
                const extension = getFileExtension(post.image.name);
                const imagePath = `post_images/${uuidv4()}.${extension}`;

                const { data: imageData, error: imageDataError } = await supabase.storage
                    .from("post_images")
                    .upload(imagePath, post.image);

                if (imageDataError) throw imageDataError;

                postImage = imageData.path;
            }

            const { error: postError } = await supabase
                .from("posts")
                .insert({
                    title: post.title,
                    content: post.description,
                    post_image: postImage,
                    user_id: user.id
                });

            if (postError) throw postError;
            
            toast.success("Post added successfully", { position: "top-right" });

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error adding post", { position: "top-right" });
        }
        
    }, [supabase, user.id])

    const addComment = useCallback(async (postId: string, comment: NewComment) => {
        console.log(postId, comment);
        try {
            const { error } = await supabase.from("comments").insert({
                content: comment.text,
                post_id: postId,
                user_id: user.id,
                root_comment_id: null
            });
            if(error) {
                console.log(error);
                throw error;
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Error adding comment", { position: "top-right" });
        }
    }, [supabase, user.id]);

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
                    key={post!.id}
                    post={post!}
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
