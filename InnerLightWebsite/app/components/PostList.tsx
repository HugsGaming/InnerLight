// components/PostList.tsx
"use client";
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";
import { createClient } from "../utils/supabase/client";
import { getFileExtension } from "../utils/files";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Tables } from "../../database.types";
import { debounce } from "../utils/debounce";

export interface Post extends Tables<"posts"> {
    comments?: Comment[] | null;
    upVotes?: Tables<"postUpVotes">[];
    downVotes?: Tables<"postDownVotes">[];
    user?: Tables<"profiles">;
    image_data?: string | null;
    downVotes_count?: { count: number }[];
    upVotes_count?: { count: number }[];
}

export interface NewPost {
    title: string;
    description: string;
    image: File | null | undefined;
    gif: File | null | undefined;
    user_id: string;
}

export interface NewComment {
    content: string;
    post_id: string;
    user_id: string;
}

export interface Comment extends Tables<"comments"> {
    user?: Tables<"profiles"> | null;
    upVotes?: Tables<"commentUpVotes">[];
    downVotes?: Tables<"commentDownVotes">[];
    downVotes_count?: { count: number }[];
    upVotes_count?: { count: number }[];
}

// Optimized PostList component
const PostList: React.FC<{
    user: Tables<"profiles">;
    initialPosts?: Post[] | null;
}> = ({ user, initialPosts }) => {
    const [posts, setPosts] = useState<(Post | null)[]>([]);
    const supabase = useMemo(() => createClient(), []);

    // Cache user data
    const userCache = useMemo(() => new Map<string, Tables<"profiles">>(), []);

    const getUser = useCallback(
        async (userId: string) => {
            if (userCache.has(userId)) {
                return userCache.get(userId);
            }
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            if (error) {
                console.error("Error fetching user:", error);
                return null;
            }
            userCache.set(userId, data);
            return data;
        },
        [supabase, userCache],
    );

    const processComments = useCallback(
        async (comments: Tables<"comments">[]) => {
            const commentIds = comments.map((comment) => comment.id);

            // Fetch all upvotes and downvotes in parallel
            const [upvotesResponse, downvotesResponse] = await Promise.all([
                supabase
                    .from("commentUpVotes")
                    .select("comment_id, user_id")
                    .in("comment_id", commentIds),
                supabase
                    .from("commentDownVotes")
                    .select("comment_id, user_id")
                    .in("comment_id", commentIds),
            ]);

            //Create maps for quick lookup
            const upvotesMap = new Map();
            const downvotesMap = new Map();

            upvotesResponse.data?.forEach((upvote) => {
                const votes = upvotesMap.get(upvote.comment_id) || [];
                votes.push(upvote);
                upvotesMap.set(upvote.comment_id, votes);
            });

            downvotesResponse.data?.forEach((downvote) => {
                const votes = downvotesMap.get(downvote.comment_id) || [];
                votes.push(downvote);
                downvotesMap.set(downvote.comment_id, votes);
            });

            //Process all comments with cached vote data
            const processedComments = await Promise.all(
                comments.map(async (comment) => {
                    const commentUser = await getUser(comment.user_id!);
                    const upvotes = upvotesMap.get(comment.id) || [];
                    const downvotes = downvotesMap.get(comment.id) || [];

                    return {
                        ...comment,
                        user: commentUser,
                        upVotes: upvotes,
                        downVotes: downvotes,
                        votes: upvotes.length - downvotes.length,
                    };
                }),
            );

            return processedComments.filter((comment) => comment !== null);
        },
        [getUser, supabase],
    );

    const imageCache = useMemo(() => new Map<string, string>(), []);

    const downloadImage = useCallback(
        async (post: Post) => {
            if (!post.post_image) return null;

            if (imageCache.has(post.post_image)) {
                return imageCache.get(post.post_image);
            }

            try {
                const { data, error } = await supabase.storage
                    .from("post_images")
                    .download(post.post_image);

                if (error) throw error;
                const url = URL.createObjectURL(data);
                imageCache.set(post.post_image, url);
                return url;
            } catch (error) {
                console.error("Error downloading image:", error);
                return null;
            }
        },
        [supabase, imageCache],
    );

    // Debounced post processing

    useEffect(() => {
        if (initialPosts) {
            setPosts(initialPosts.filter((post) => post !== null));
            console.log("Initial posts set:", initialPosts);
        }
    }, [initialPosts]);
    // Optimized useEffect with cleanup
    // useEffect(() => {
    //     let mounted = true;
    //     const abortController = new AbortController();

    //     const fetchPosts = async () => {
    //         if(!initialPosts) return;

    //         const postPromises = initialPosts.map(post => debouncedProcessPost(post));
    //         const processedPosts = await Promise.all(postPromises);

    //         console.log(processedPosts);

    //         if(mounted) {
    //             setPosts(processedPosts.filter(post => post !== null));
    //         }
    //     };

    //     fetchPosts();

    //     return () => {
    //         mounted = false;
    //         abortController.abort();
    //         // Cleanup image cache
    //         imageCache.forEach(url => URL.revokeObjectURL(url));
    //         imageCache.clear();
    //     }
    // }, [initialPosts, debouncedProcessPost]);

    const handleVote = useCallback(
        async (postId: string, voteType: "up" | "down") => {
            //Find the post to update
            const targetPost = posts.find((post) => post?.id === postId);
            if (!targetPost) return;

            //Prepare Optimistic Update
            const optimisticUpdate = (currentPost: Post) => {
                const currentUpVotes = currentPost.upVotes || [];
                const currentDownVotes = currentPost.downVotes || [];

                // Remove existing votes by this user
                const filteredUpVotes = currentUpVotes.filter(
                    (vote) => vote.user_id !== user.id,
                );
                const filteredDownVotes = currentDownVotes.filter(
                    (vote) => vote.user_id !== user.id,
                );

                const newVote = {
                    id: `temp-${Date.now()}`,
                    created_at: new Date().toISOString(),
                    user_id: user.id,
                    post_id: postId,
                };

                if (voteType === "up") {
                    return {
                        ...currentPost,
                        upVotes: [...filteredUpVotes, newVote],
                        downVotes: filteredDownVotes,
                        upVotes_count: [{ count: filteredUpVotes.length + 1 }],
                        downVotes_count: [{ count: filteredDownVotes.length }],
                    } as Post;
                } else {
                    return {
                        ...currentPost,
                        upVotes: filteredUpVotes,
                        downVotes: [...filteredDownVotes, newVote],
                        upVotes_count: [{ count: filteredUpVotes.length }],
                        downVotes_count: [
                            { count: filteredDownVotes.length + 1 },
                        ],
                    } as Post;
                }
            };

            //Apply optimistic update
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post?.id === postId ? optimisticUpdate(post) : post,
                ),
            );

            try {
                //Remove any existing votes first
                await Promise.all([
                    supabase
                        .from("postUpVotes")
                        .delete()
                        .match({ user_id: user.id, post_id: postId }),
                    supabase
                        .from("postDownVotes")
                        .delete()
                        .match({ user_id: user.id, post_id: postId }),
                ]);

                //Insert the new vote
                const table =
                    voteType === "up" ? "postUpVotes" : "postDownVotes";
                const { error } = await supabase
                    .from(table)
                    .insert({ post_id: postId, user_id: user.id });

                if (error) throw error;
            } catch (error) {
                //Revert the optimistic update
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post?.id === postId ? targetPost : post,
                    ),
                );

                toast.error("Error voting on post");
                console.error("Error voting on post:", error);
            }
        },
        [supabase, user.id, posts],
    );

    // const addPost = useCallback(
    //     async (post: NewPost) => {
    //         let newPost: Post;
    //         try {
    //             let postImage: string | null = null;

    //             if (post.image) {
    //                 const extension = getFileExtension(post.image.name);
    //                 const imagePath = `post_images/${uuidv4()}.${extension}`;

    //                 const { data: imageData, error: imageDataError } =
    //                     await supabase.storage
    //                         .from("post_images")
    //                         .upload(imagePath, post.image);

    //                 if (imageDataError) throw imageDataError;

    //                 postImage = imageData.path;
    //             }

    //             newPost = {
    //                 id: `temporary-${Date.now()}`,
    //                 title: post.title,
    //                 content: post.description,
    //                 post_image: postImage,
    //                 user_id: user.id,
    //                 user,
    //                 created_at: new Date().toISOString(),
    //                 comments:[],
    //                 votes: 0
    //             }

    //             setPosts((prevPosts) => [...prevPosts, newPost]);

    //             const { data, error: postError } = await supabase
    //                 .from("posts")
    //                 .insert({
    //                     title: post.title,
    //                     content: post.description,
    //                     post_image: postImage,
    //                     user_id: user.id,
    //                 })
    //                 .select("*")
    //                 .single();

    //             if (postError) {
    //                 console.error("Error adding post:", postError);
    //                 throw postError;
    //             };

    //             const transformedPost = {
    //                 ...data,
    //                 user,
    //             };

    //             const processedPost = await debouncedProcessPost(transformedPost);

    //             if (processedPost) {
    //                 setPosts((prevPosts) => [
    //                     processedPost,
    //                     ...prevPosts.filter((post) => post?.id !== newPost.id),
    //                 ]);
    //             }

    //             toast.success("Post added successfully", {
    //                 position: "top-right",
    //             });
    //         } catch (error) {
    //             setPosts((prevPosts) =>
    //                 prevPosts.filter((post) => post?.id !== newPost.id),
    //             );
    //             toast.error(
    //                 error instanceof Error
    //                     ? error.message
    //                     : "Error adding post",
    //                 { position: "top-right" },
    //             );
    //         }
    //     },
    //     [supabase, user.id, debouncedProcessPost],
    // );

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
            {posts?.length === 0 && <p>No posts found.</p>}
            {posts?.map((post) => (
                <PostItem
                    key={post!.id}
                    user={user}
                    post={post!}
                    onVote={handleVote}
                />
            ))}
        </div>
    );
};

export default memo(PostList);
