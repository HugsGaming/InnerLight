// components/PostList.tsx
"use client";
import React, {
    useEffect,
    useState,
    useMemo,
    useCallback,
    memo
} from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";
import { createClient } from "../utils/supabase/client";
import { getFileExtension } from "../utils/files";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Tables } from "../../database.types";
import { debounce } from '../utils/debounce';

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

// Memoize the PostItem component
const MemoizzedPostItem = memo(PostItem);


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
                if(userCache.has(userId)) {
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
                    .from("commentUpvote")
                    .select("comment_id, user_id")
                    .in("comment_id", commentIds),
                supabase
                    .from("commentDownVote")
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
                    }
                })
            );

            return processedComments.filter(comment => comment !== null);
        },
        [getUser, supabase],
    );

    const imageCache = useMemo(() => new Map<string, string>(), []);

    const downloadImage = useCallback(
        async (post: Post) => {
            if (!post.post_image) return null;

            if(imageCache.has(post.post_image)) {
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
    const debouncedProcessPost = useCallback(
        debounce(async (post: Post): Promise<Post | null> => {
            try {
                const [postData, user, imageData] = await Promise.all([
                    supabase
                        .from("posts")
                        .select("*, comments(*), upVotes:postUpvotes(*), downVotes:postDownvotes(*)")
                        .eq("id", post.id)
                        .single(),
                    getUser(post.user_id!),
                    downloadImage(post),
                ]);

                if (!postData.data) return null;

                if(!user) return null;

                const processedComments = await processComments(postData.data?.comments || []);

                return {
                    ...postData.data,
                    user,
                    image_data: imageData,
                    comments: processedComments,
                    votes: (postData.data?.upVotes?.length || 0) - (postData.data?.downVotes?.length || 0),
                }
            } catch (error) {
                console.error("Error processing post:", error);
                return null;
            }
        }, 100),
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

    // Optimized useEffect with cleanup
    useEffect(() => {
        let mounted = true;
        const abortController = new AbortController();

        const fetchPosts = async () => {
            if(!initialPosts) return;

            const postPromises = initialPosts.map(post => debouncedProcessPost(post));
            const processedPosts = await Promise.all(postPromises);

            if(mounted) {
                setPosts(processedPosts.filter(post => post !== null));
            }
        };

        fetchPosts();

        return () => {
            mounted = false;
            abortController.abort();
            // Cleanup image cache
            imageCache.forEach(url => URL.revokeObjectURL(url));
            imageCache.clear();
        }
    }, [initialPosts, debouncedProcessPost]);

    const handleVote = useCallback(async (postId: string, voteType: "up" | "down") => {
        const optimisticVote = voteType === "up" ? 1 : -1;

        setPosts(prevPosts =>
            prevPosts.map(post => 
                post?.id === postId ? { ...post, votes: (post.votes || 0) + optimisticVote } : post
            )
        );

        try {
            const table = voteType === "up" ? "postUpvotes" : "postDownvotes";
            await supabase.from(table).insert({post_id: postId,user_id: user.id})
        } catch (error) {
            setPosts(prevPosts =>
                prevPosts.map(post => 
                    post?.id === postId ? { ...post, votes: (post.votes || 0) - optimisticVote } : post
                )
            )

            toast.error('Failed to Register Vote');
        }


    }, [supabase, user.id]);

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

export default memo(PostList);
