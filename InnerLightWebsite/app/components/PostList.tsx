// components/PostList.tsx
"use client";
import React, {
    useEffect,
    useState,
    useMemo,
    useCallback,
    Suspense,
} from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";
import { createClient } from "../utils/supabase/client";
import { getFileExtension } from "../utils/files";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Tables } from "../../database.types";

export interface Post extends Tables<"posts"> {
    comments?: Comment[] | null;
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
    content: string;
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

    const getUser: (userId: string) => Promise<Tables<"profiles"> | null> =
        useCallback(
            async (userId: string) => {
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
            },
            [supabase],
        );

    const processComments = useCallback(
        async (comments: Tables<"comments">[]) => {
            const processedComments = await Promise.all(
                comments.map(async (comment) => {
                    const commentUser = await getUser(comment.user_id!);

                    const { data: upvotes, error: upvotesError } =
                        await supabase
                            .from("commentUpvote")
                            .select("id, user_id")
                            .eq("comment_id", comment.id);

                    if (upvotesError) {
                        toast.error(upvotesError.message, {
                            position: "top-right",
                        });
                        return null;
                    }

                    const { data: downvotes, error: downvotesError } =
                        await supabase
                            .from("commentDownVote")
                            .select("id, user_id")
                            .eq("comment_id", comment.id);

                    if (downvotesError) {
                        toast.error(downvotesError.message, {
                            position: "top-right",
                        });
                        return null;
                    }

                    return {
                        ...comment,
                        user: commentUser,
                        upVotes: upvotes,
                        downVotes: downvotes,
                        votes:
                            (upvotes?.length ?? 0) - (downvotes?.length ?? 0),
                    } as Comment;
                }),
            );
            return processedComments.filter(
                (comment): comment is Comment => comment !== null,
            );
        },
        [getUser, supabase],
    );

    const downloadImage = useCallback(
        async (post: Post) => {
            if (!post.post_image) return null;

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
                toast.error("Error downloading image", {
                    position: "top-right",
                });
                return null;
            }
        },
        [supabase],
    );

    const processPost = useCallback(
        async (post: Post): Promise<Post | null> => {
            try {
                const { data: postData, error: postError } = await supabase
                    .from("posts")
                    .select(
                        "*, comments(*), upVotes:postUpvotes(*), downVotes:postDownvotes(*)",
                    )
                    .eq("id", post.id)
                    .single();

                if (postError) throw postError;

                const user = await getUser(post.user_id!);
                if (!user) return null;

                const image_data = await downloadImage(post);
                const processedComments = await processComments(
                    postData.comments || [],
                );

                return {
                    ...postData,
                    user,
                    image_data,
                    comments: processedComments || [],
                    votes:
                        (postData.upVotes?.length ?? 0) -
                        (postData.downVotes?.length ?? 0),
                };
            } catch (error) {
                toast.error("Error processing post: " + error, {
                    position: "top-right",
                });
                return null;
            }
        },
        [getUser, downloadImage, processComments, supabase],
    );

    const processComment = useCallback(
        async (comment: Comment) => {
            const commentUser = await getUser(comment.user_id!);
            return {
                ...comment,
                user: commentUser,
                votes: 0,
            };
        },
        [getUser],
    );

    useEffect(() => {
        const fetchPosts = async () => {
            if (!initialPosts?.length) return;

            const postWithData = await Promise.all(
                initialPosts.map(processPost),
            );
            setPosts(postWithData.filter((post) => post !== null));
        };

        fetchPosts();
    }, [initialPosts, processPost]);

    // useEffect(() => {
    //     const channel = supabase
    //         .channel("realtime_posts")
    //         .on(
    //             "postgres_changes",
    //             { event: "INSERT", schema: "public", table: "posts" },
    //             async (payload) => {
    //                 const newPostData = payload.new as Post;
    //                 const processedPost = await processPost(newPostData);

    //                 if (processedPost) {
    //                     setPosts((prevPosts) => [
    //                         processedPost,
    //                         ...(prevPosts ?? []),
    //                     ]);
    //                 }
    //             },
    //         )
    //         .on('postgres_changes',
    //             {event: 'INSERT', schema: 'public', table: 'comments'},
    //             async (payload) => {
    //                 const newCommentData = payload.new as Comment;
    //                 const processedComment = await processComment(newCommentData);

    //                 setPosts((prevPosts) => {
    //                     return prevPosts.map((post) => {
    //                         if (post?.id === newCommentData.post_id) {
    //                             const commentExists = post.comments?.some(comment => comment.id === newCommentData.id);
    //                             if (commentExists) return post;

    //                             return {
    //                                 ...post,
    //                                 comments: [...(post.comments ?? []), processedComment],
    //                             };
    //                         }
    //                         return post;
    //                     })
    //                 })
    //             }
    //         )
    //         .subscribe();

    //     return () => {
    //         channel.unsubscribe();
    //     };
    // }, [supabase, processPost, processComment]);

    const addComment = useCallback(
        async (postId: string, comment: NewComment) => {
            const optimisticComment = {
                id: `temporary-${Date.now()}`,
                content: comment.content,
                post_id: postId,
                user_id: user.id,
                created_at: new Date().toISOString(),
                user,
                root_comment_id: null,
                votes: 0,
            };
            try {
                setPosts((prevPosts) =>
                    prevPosts.map((post) => {
                        if (post?.id === postId) {
                            return {
                                ...post,
                                comments: [
                                    ...(post.comments ?? []),
                                    optimisticComment,
                                ],
                            };
                        }
                        return post;
                    }),
                );

                console.log("Comment added:", optimisticComment);

                const { data, error } = await supabase
                    .from("comments")
                    .insert({
                        content: comment.content,
                        post_id: postId,
                        user_id: user.id,
                        root_comment_id: null,
                    })
                    .select("*")
                    .single();

                if (error) {
                    console.error("Error adding comment:", error);
                    throw error;
                }

                const commentWithUser = await processComment(data);

                setPosts((prevPosts) =>
                    prevPosts.map((post) => {
                        if (post?.id === postId) {
                            return {
                                ...post,
                                comments:
                                    post.comments?.map((comment) =>
                                        comment.id === optimisticComment.id
                                            ? ({
                                                  ...commentWithUser,
                                                  user: commentWithUser.user,
                                                  votes: 0,
                                              } as Comment)
                                            : comment,
                                    ) || [],
                            };
                        }
                        return post;
                    }),
                );

                //Optimistically update the UI
                // const processedComment = await processComment(data);
                // setPosts((prevPosts) => {
                //     return prevPosts.map((post) => {
                //         if (post?.id === postId) {
                //             return {
                //                 ...post,
                //                 comments: [...(post.comments ?? []), processedComment],
                //             };
                //         }
                //         return post;
                //     })
                // })

                toast.success("Comment added successfully", {
                    position: "top-right",
                });
            } catch (error) {
                setPosts((prevPosts) =>
                    prevPosts.map((post) => {
                        if (post?.id === postId) {
                            return {
                                ...post,
                                comments: post.comments?.filter(
                                    (comment) =>
                                        comment.id !== optimisticComment.id,
                                ),
                            };
                        }
                        return post;
                    }),
                );

                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Error adding comment",
                    {
                        position: "top-right",
                    },
                );
            }
        },
        [supabase, processComment, user],
    );

    const addPost = useCallback(
        async (post: NewPost) => {
            let newPost: Post;
            try {
                let postImage: string | null = null;

                if (post.image) {
                    const extension = getFileExtension(post.image.name);
                    const imagePath = `post_images/${uuidv4()}.${extension}`;

                    const { data: imageData, error: imageDataError } =
                        await supabase.storage
                            .from("post_images")
                            .upload(imagePath, post.image);

                    if (imageDataError) throw imageDataError;

                    postImage = imageData.path;
                }

                newPost = {
                    id: `temporary-${Date.now()}`,
                    title: post.title,
                    content: post.description,
                    post_image: postImage,
                    user_id: user.id,
                    user,
                    created_at: new Date().toISOString(),
                    comments:[],
                    votes: 0
                }

                setPosts((prevPosts) => [...prevPosts, newPost]);

                const { data, error: postError } = await supabase
                    .from("posts")
                    .insert({
                        title: post.title,
                        content: post.description,
                        post_image: postImage,
                        user_id: user.id,
                    })
                    .select("*")
                    .single();

                if (postError) {
                    console.error("Error adding post:", postError);
                    throw postError;
                };

                const transformedPost = {
                    ...data,
                    user,
                };

                const processedPost = await processPost(transformedPost);

                if (processedPost) {
                    setPosts((prevPosts) => [
                        processedPost,
                        ...prevPosts.filter((post) => post?.id !== newPost.id),
                    ]);
                }

                toast.success("Post added successfully", {
                    position: "top-right",
                });
            } catch (error) {
                setPosts((prevPosts) =>
                    prevPosts.filter((post) => post?.id !== newPost.id),
                );
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Error adding post",
                    { position: "top-right" },
                );
            }
        },
        [supabase, user.id, processPost],
    );

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
