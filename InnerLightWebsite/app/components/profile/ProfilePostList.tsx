import React, {
    useState,
    useCallback,
    memo,
    useEffect,
    useRef,
    useMemo,
    use,
} from "react";
import { createClient } from "../../utils/supabase/client";
import { toast } from "react-toastify";
import PostItem from "../PostItem";
import { Tables } from "../../../database.types";
import { Post } from "../PostList";

const POSTS_PER_PAGE = 10;

interface ProfilePostListProps {
    user: Tables<"profiles">;
    posts: Post[];
    className?: string;
    mediaOnly?: boolean;
}

function ProfilePostList({
    user,
    posts: initialPosts,
    className = "",
    mediaOnly = false,
}: ProfilePostListProps) {
    const [posts, setPosts] = useState<Post[]>(
        initialPosts.slice(0, POSTS_PER_PAGE),
    );
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef<HTMLDivElement>(null);
    const supabase = useMemo(() => createClient(), []);

    const loadMorePosts = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const from = page * POSTS_PER_PAGE;
            const to = from + POSTS_PER_PAGE - 1;

            const { data: newPosts, error } = await supabase
                .from("posts")
                .select(
                    `
                    *,
                    comments(
                        *,
                        user:profiles(*),
                        upVotes:commentUpVotes(*),
                        upVotes_count:commentUpVotes(count),
                        downVotes:commentDownVotes(*),
                        downVotes_count:commentDownVotes(count)
                    ),
                    upVotes:postUpVotes(*),
                    upVotes_count:postUpVotes(count),
                    downVotes:postDownVotes(*),
                    downVotes_count:postDownVotes(count),
                    user:profiles(*)
                `,
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (newPosts.length === 0) {
                setHasMore(false);
            }

            setPosts((prevPosts) => [...prevPosts, ...(newPosts as Post[])]);
            setPage((prevPage) => prevPage + 1);
        } catch (error) {
            console.error("Error loading more posts:", error);
            toast.error("Error loading more posts");
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore, supabase, user.id]);

    const loadMoreMediaPosts = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);

        try {
            const from = page * POSTS_PER_PAGE;
            const to = from + POSTS_PER_PAGE - 1;

            const { data: newPosts, error } = await supabase
                .from("posts")
                .select(
                    `
                    *,
                    comments(
                        *,
                        user:profiles(*),
                        upVotes:commentUpVotes(*),
                        upVotes_count:commentUpVotes(count),
                        downVotes:commentDownVotes(*),
                        downVotes_count:commentDownVotes(count)
                    ),
                    upVotes:postUpVotes(*),
                    upVotes_count:postUpVotes(count),
                    downVotes:postDownVotes(*),
                    downVotes_count:postDownVotes(count),
                    user:profiles(*)
                `,
                )
                .eq("user_id", user.id)
                .neq("post_image", null)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (newPosts.length < POSTS_PER_PAGE) {
                setHasMore(false);
            }

            setPosts((prevPosts) => [...prevPosts, ...(newPosts as Post[])]);
            setPage((prevPage) => prevPage + 1);
        } catch (error) {
            console.error("Error fetching more media posts.", error);
            toast.error("Error fething more media posts.");
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore, supabase, user.id]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    if (mediaOnly) {
                        loadMoreMediaPosts();
                    } else {
                        loadMorePosts();
                    }
                }
            },
            { threshold: 0.5 },
        );

        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }

        return () => observer.disconnect();
    }, [loadMoreMediaPosts, loadMorePosts, hasMore, isLoading]);

    const handleVote = useCallback(
        async (postId: string, voteType: "up" | "down") => {
            const targetPost = posts.find((post) => post.id === postId);
            if (!targetPost) return;

            const optimisticUpdate = (currentPost: Post) => {
                const currentUpVotes = currentPost.upVotes || [];
                const currentDownVotes = currentPost.downVotes || [];

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

            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId ? optimisticUpdate(post) : post,
                ),
            );

            try {
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

                const table =
                    voteType === "up" ? "postUpVotes" : "postDownVotes";
                const { error } = await supabase
                    .from(table)
                    .insert({ post_id: postId, user_id: user.id });

                if (error) throw error;
            } catch (error) {
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post.id === postId ? targetPost : post,
                    ),
                );
                toast.error("Error voting on post");
                console.error("Error voting on post:", error);
            }
        },
        [supabase, user.id, posts],
    );

    return (
        <div
            className={`container px-6 py-10 mx-auto bg-white dark:bg-gray-700 ${className}`}
        >
            {posts.length === 0 && (
                <p className="text-gray-500 dark:text-gray-300">
                    No posts found.
                </p>
            )}
            {posts.map((post) => (
                <PostItem
                    key={post.id}
                    user={user}
                    post={post}
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
}

export default memo(ProfilePostList);
