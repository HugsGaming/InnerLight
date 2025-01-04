// components/PostList.tsx
"use client";
import React, {
    useEffect,
    useState,
    useMemo,
    useCallback,
    memo,
    useRef,
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

const POST_PER_PAGE = 10;

// Optimized PostList component
const PostList: React.FC<{
    user: Tables<"profiles">;
    initialPosts?: Post[] | null;
    showAddPost?: boolean;
}> = ({ user, initialPosts, showAddPost }) => {
    const [posts, setPosts] = useState<(Post | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const loadingRef = useRef<HTMLDivElement>(null);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (initialPosts) {
            setPosts(initialPosts.filter((post) => post !== null));
            setPage(1);
        }
    }, [initialPosts]);

    const fetchMorePosts = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const from = page * POST_PER_PAGE;
            const to = from + POST_PER_PAGE - 1;

            const { data: newPosts, error } = await supabase
                .from("posts")
                .select(
                    "*, comments(*, user:profiles(*), upVotes:commentUpVotes(*), upVotes_count:commentUpVotes(count), downVotes:commentDownVotes(*), downVotes_count:commentDownVotes(count)), downVotes:postDownVotes(*), downVotes_count:postDownVotes(count), upVotes:postUpVotes(*), upVotes_count:postUpVotes(count), user:profiles(*)",
                )
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (newPosts.length < POST_PER_PAGE) {
                setHasMore(false);
            }

            setPosts((prevPosts) => [...prevPosts, ...(newPosts as Post[])]);
            setPage((prevPage) => prevPage + 1);
        } catch (error) {
            console.error("Error fetching more posts:", error);
            toast.error("Error fetching more posts.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase, isLoading, hasMore, page]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    fetchMorePosts();
                }
            },
            { threshold: 0.5 },
        );

        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }

        return () => observer.disconnect();
    }, [fetchMorePosts, hasMore, isLoading]);

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

    const addPost = useCallback(
        async (post: NewPost) => {
            // Temporary ID for optimistic update
            const tempPostId = `temp-${Date.now()}`;

            // Prepare optimistic post object
            const optimisticPost: Post = {
                id: tempPostId,
                title: post.title,
                content: post.description,
                post_image: null,
                user_id: user.id,
                user,
                created_at: new Date().toISOString(),
                comments: [],
                upVotes_count: [{ count: 0 }],
                downVotes_count: [{ count: 0 }],
                upVotes: [],
                downVotes: [],
            };

            try {
                //Optimistically add the post to the list
                setPosts((prevPosts) => [...prevPosts, optimisticPost]);

                //Handle image upload if present
                let postImage: string | null = null;
                if (post.image) {
                    const extension = getFileExtension(post.image.name);
                    const imagePath = `post_images/${uuidv4()}.${extension}`;

                    const { data: imageData, error: imageError } =
                        await supabase.storage
                            .from("post_images")
                            .upload(imagePath, post.image);

                    if (imageError) throw imageError;
                    postImage = imageData?.path;
                }

                //Insert the post into the database
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

                if (postError) throw postError;

                //Transform the post with full data
                const finalPost: Post = {
                    ...data,
                    user,
                    comments: [],
                    upVotes_count: [{ count: 0 }],
                    downVotes_count: [{ count: 0 }],
                    upVotes: [],
                    downVotes: [],
                };

                //Update post list, replacing the temporary post with the final post
                setPosts((prevPosts) => [
                    finalPost,
                    ...prevPosts.filter((post) => post?.id !== tempPostId),
                ]);

                toast.success("Post added successfully");
            } catch (error) {
                setPosts((prevPosts) =>
                    prevPosts.filter((post) => post?.id !== tempPostId),
                );
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Error adding post",
                );
            }
        },
        [supabase, user],
    );

    return (
        <div className="container px-6 py-10 mx-auto bg-white dark:bg-gray-700">
            {showAddPost && <PostComponent addPost={addPost} user={user} />}
            {posts?.length === 0 && <p>No posts found.</p>}
            {posts?.map((post) => (
                <PostItem
                    key={post!.id}
                    user={user}
                    post={post!}
                    onVote={handleVote}
                />
            ))}
            <div
                ref={loadingRef}
                className="w-full h-16 flex items-center justify-center"
            >
                {isLoading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
                )}
                {!hasMore && posts.length > 0 && (
                    <p className="text-gray-500 dark:text-white">
                        No more posts to load
                    </p>
                )}
            </div>
        </div>
    );
};

export default memo(PostList);
