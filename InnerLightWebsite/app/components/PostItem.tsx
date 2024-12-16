import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    memo,
    FormEvent,
    FC,
} from "react";
import {
    FaHeart,
    FaComment,
    FaArrowUp,
    FaArrowDown,
    FaEdit,
} from "react-icons/fa";
import { Tables } from "../../database.types";
import { Post } from "./PostList";
import { createClient } from "../utils/supabase/client";
import { Comment } from "./PostList";
import { toast } from "react-toastify";
import Image from "next/image";
import { set } from "zod";
import Link from "next/link";

interface VoteRecord {
    comment_id: string;
    user_id: string;
}

interface PostItemProps {
    user: Tables<"profiles">;
    post: Post;
    onVote: (postId: string, voteType: "up" | "down") => void;
}

// Seperate the logic for rendering the comments into a separate component
const CommentItem = memo(
    ({
        comment,
        onVote,
        currentUserId,
        userVotes,
    }: {
        comment: Comment;
        onVote: (
            commentId: string,
            voteType: "up" | "down",
            currentVote: "up" | "down" | null,
        ) => void;
        currentUserId: string;
        userVotes: {
            upVotes: VoteRecord[];
            downVotes: VoteRecord[];
        };
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [localUpVotes, setLocalUpVotes] = useState(
            comment.upVotes_count![0]?.count || 0,
        );
        const [localDownVotes, setLocalDownVotes] = useState(
            comment.downVotes_count![0]?.count || 0,
        );

        // Determine current vote state
        const userCurrentVote = useMemo(() => {
            if (
                userVotes.upVotes.some((vote) => vote.comment_id === comment.id)
            ) {
                return "up";
            } else if (
                userVotes.downVotes.some(
                    (vote) => vote.comment_id === comment.id,
                )
            ) {
                return "down";
            }
            return null;
        }, [userVotes, comment.id]);

        const handleVote = (voteType: "up" | "down") => {
            if (!currentUserId) return;

            //Optimistically update the UI
            if (userCurrentVote === voteType) {
                //Removing vote
                if (voteType === "up") {
                    setLocalUpVotes(localUpVotes - 1);
                } else {
                    setLocalDownVotes(localDownVotes - 1);
                }
            } else {
                //Adding/changing vote
                if (userCurrentVote) {
                    // Remove old vote
                    if (userCurrentVote === "up") {
                        setLocalUpVotes(localUpVotes - 1);
                    } else {
                        setLocalDownVotes(localDownVotes - 1);
                    }
                }

                //Add new vote
                if (voteType === "up") {
                    setLocalUpVotes(localUpVotes + 1);
                } else {
                    setLocalDownVotes(localDownVotes + 1);
                }
            }

            onVote(comment.id, voteType, userCurrentVote);
        };

        const voteCount = localUpVotes - localDownVotes;

        console.log(localUpVotes, localDownVotes);

        return (
            <div className="mb-2">
                <div
                    className="flex items-center  space-x-2 cursor-pointer"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="text-sm">{comment.user?.username}</div>
                    <div>{comment.content}</div>
                    {isOpen && (
                        <div className="mt-2 ml-4 transition-all duration-300 ease-in-out">
                            <div className="flex items-center space-x-1">
                                <button
                                    className={`transition-colors duration-300 ${
                                        userCurrentVote === "up"
                                            ? "text-green-500"
                                            : "hover:text-green-500 text-gray-500"
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote("up");
                                    }}
                                >
                                    <FaArrowUp className="w-4 h-4 fill-current" />
                                </button>
                                <span
                                    className={`font-medium ${
                                        voteCount > 0
                                            ? "text-green-500"
                                            : voteCount < 0
                                              ? "text-red-500"
                                              : "text-gray-500"
                                    }`}
                                >
                                    {voteCount}
                                </span>
                                <button
                                    className={`transition-colors duration-300 ${
                                        userCurrentVote === "down"
                                            ? "text-red-500"
                                            : "hover:text-red-500 text-gray-500"
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote("down");
                                    }}
                                >
                                    <FaArrowDown className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    },
);

CommentItem.displayName = "CommentItem";

// Seperate the logic for rendering the comment form into a separate component
const CommentForm = memo(
    ({ onSubmit }: { onSubmit: (content: string) => Promise<boolean> }) => {
        const [commentText, setCommentText] = useState("");
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async (e: FormEvent) => {
            e.preventDefault();
            if (!commentText.trim() || isSubmitting) return;

            setIsSubmitting(true);

            const success = await onSubmit(commentText);
            if (success) {
                setCommentText("");
            }
            setIsSubmitting(false);
        };
        return (
            <form
                onSubmit={handleSubmit}
                className="flex items-center space-x-2 mt-2"
            >
                <input
                    type="text"
                    className="border p-2 rounded-md w-full transition-colors duration-300 bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmitting}
                />
                <button
                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                    type="submit"
                    disabled={isSubmitting}
                >
                    Comment
                </button>
            </form>
        );
    },
);

CommentForm.displayName = "CommentForm";

const PostImage = ({ post }: { post: Post }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = useMemo(() => createClient(), []);

    const downloadImage = useCallback(async () => {
        if (!post.post_image) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.storage
                .from("post_images")
                .download(post.post_image);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            setImageUrl(url);
        } catch (error) {
            console.error("Error downloading image:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, post.post_image]);

    useEffect(() => {
        downloadImage();

        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [downloadImage]);
    if (isLoading) {
        return (
            <div className="mt-4 relative w-full max-w-xl h-96 rounded-md bg-gray-100 animate-pulse" />
        );
    }

    if (!imageUrl) {
        return null;
    }

    return (
        <div className="mt-4 relative w-full max-w-xl h-96 rounded-md">
            <Image
                src={imageUrl}
                alt="Post Image"
                fill
                priority
                className="object-contain rounded-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
};

const PostItem: FC<PostItemProps> = ({ user, post, onVote }) => {
    const [showComments, setShowComments] = useState(false);
    const [localComments, setLocalComments] = useState<Comment[]>([]);
    const [commentVotes, setCommentVotes] = useState<{
        upVotes: VoteRecord[];
        downVotes: VoteRecord[];
    }>({
        upVotes: [],
        downVotes: [],
    });

    //Track User's vote on the post
    const [userVote, setUserVote] = useState<"up" | "down" | null>(() => {
        //Initialize userVote based on existing votes
        if (post.upVotes?.some((vote) => vote.user_id === user.id)) return "up";
        if (post.downVotes?.some((vote) => vote.user_id === user.id))
            return "down";
        return null;
    });

    const supabase = useMemo(() => createClient(), []);

    //Fetch user's votes on comments
    useEffect(() => {
        const fetchUserVotes = async () => {
            const commentIds =
                post.comments?.map((comment) => comment.id) || [];
            if (commentIds?.length === 0) return;

            const [upVotesResponse, downVotesResponse] = await Promise.all([
                supabase
                    .from("commentUpVotes")
                    .select("comment_id, user_id")
                    .in("comment_id", commentIds),
                supabase
                    .from("commentDownVotes")
                    .select("comment_id, user_id")
                    .in("comment_id", commentIds),
            ]);

            setCommentVotes({
                upVotes: (upVotesResponse.data as VoteRecord[]) || [],
                downVotes: (downVotesResponse.data as VoteRecord[]) || [],
            });
        };

        if (showComments) {
            fetchUserVotes();
        }
    }, [showComments, post.comments, user.id, supabase]);

    useEffect(() => {
        setLocalComments(post.comments || []);
    }, [post.comments]);

    // Optimistic comment Voting
    const handleCommentVote = useCallback(
        async (
            commentId: string,
            voteType: "up" | "down",
            currentVote: "up" | "down" | null,
        ) => {
            const newVoteTable =
                voteType === "up" ? "commentUpVotes" : "commentDownVotes";
            const oldVoteTable =
                currentVote === "up" ? "commentUpVotes" : "commentDownVotes";

            try {
                if (currentVote === voteType) {
                    //Remove vote
                    const { error } = await supabase
                        .from(newVoteTable)
                        .delete()
                        .eq("comment_id", commentId)
                        .eq("user_id", user.id);

                    if (error) throw error;

                    //Update Local State
                    setCommentVotes((prev) => ({
                        ...prev,
                        [voteType === "up" ? "upVotes" : "downVotes"]: prev[
                            voteType === "up" ? "upVotes" : "downVotes"
                        ].filter((vote) => vote.comment_id !== commentId),
                    }));
                } else {
                    //Start Transaction
                    if (currentVote) {
                        // Remove old vote
                        await supabase
                            .from(oldVoteTable)
                            .delete()
                            .eq("comment_id", commentId)
                            .eq("user_id", user.id);
                    }

                    //Add new vote
                    const { error } = await supabase
                        .from(newVoteTable)
                        .insert({ comment_id: commentId, user_id: user.id });

                    if (error) throw error;

                    //Update Local State
                    setCommentVotes((prev) => {
                        const newState = { ...prev };

                        if (currentVote) {
                            //Remove old vote
                            newState[
                                currentVote === "up" ? "upVotes" : "downVotes"
                            ] = newState[
                                currentVote === "up" ? "upVotes" : "downVotes"
                            ].filter((vote) => vote.comment_id !== commentId);
                        }

                        //Add new state
                        newState[voteType === "up" ? "upVotes" : "downVotes"] =
                            [
                                ...prev[
                                    voteType === "up" ? "upVotes" : "downVotes"
                                ],
                                { comment_id: commentId, user_id: user.id },
                            ];

                        return newState;
                    });
                }
            } catch (error) {
                setLocalComments(post.comments || []);
                toast.error("Error voting on comment");
            }
        },
        [supabase, user.id, post.comments],
    );

    // Memoize comment submission handler
    const handleAddComment = useCallback(
        async (content: string): Promise<boolean> => {
            if (!content.trim()) return false;

            const optimisticComment: Comment = {
                id: `temp-${Date.now()}`,
                content,
                post_id: post.id,
                user_id: user.id,
                created_at: new Date().toISOString(),
                root_comment_id: null,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    created_at: user.created_at,
                } as Tables<"profiles">,
                upVotes: [],
                downVotes: [],
                upVotes_count: [{ count: 0 }],
                downVotes_count: [{ count: 0 }],
            };

            setLocalComments((prevComments) => [
                ...prevComments,
                optimisticComment,
            ]);

            try {
                const { data, error } = await supabase
                    .from("comments")
                    .insert({
                        content,
                        post_id: post.id,
                        user_id: user.id,
                        root_comment_id: null,
                    })
                    .select(
                        "*, user:profiles(*), upVotes:commentUpVotes(*), upVotes_count:commentUpVotes(count), downVotes:commentDownVotes(*), downVotes_count:commentDownVotes(count)",
                    )
                    .single();

                if (error) throw error;

                //Replace optimistic comment on error
                setLocalComments((prev) =>
                    prev.map((comment) =>
                        comment.id === optimisticComment.id ? data : comment,
                    ),
                );

                return true;
            } catch (error) {
                setLocalComments((prev) =>
                    prev.filter(
                        (comment) => comment.id !== optimisticComment.id,
                    ),
                );

                toast.error("Error adding comment");
                return false;
            }
        },
        [post.id, supabase, user],
    );

    const postVoteCount = useMemo(() => {
        if (!post.upVotes_count || !post.downVotes_count) return 0;
        return post.upVotes_count[0].count - post.downVotes_count[0].count;
    }, [post.downVotes_count, post.upVotes_count]);

    const handleUpvote = useCallback(() => {
        //If user has already voted, remove their vote
        const newVoteType = userVote === "up" ? null : "up";
        setUserVote(newVoteType);
        onVote(post.id, newVoteType || "up");
    }, [onVote, post.id]);

    const handleDownvote = useCallback(() => {
        //If user has already voted, remove their vote
        const newVoteType = userVote === "down" ? null : "down";
        setUserVote(newVoteType);
        onVote(post.id, newVoteType || "down");
    }, [onVote, post.id]);

    return (
        <div className="flex border p-4 rounded-lg shadow-md mb-4 transition-colors duration-300 bg-white dark:bg-gray-800 text-gray-600 dark:text-white">
            <div className="flex flex-col items-center space-y-1 mr-4">
                <button
                    onClick={handleUpvote}
                    className={`transition-colors duration-300  ${
                        userVote === "up"
                            ? "text-green-500"
                            : "hover:text-green-500 text-gray-500"
                    }`}
                >
                    <FaArrowUp className="w-5 h-5  fill-current" />
                </button>
                <span>{postVoteCount}</span>
                <button
                    onClick={handleDownvote}
                    className={`transition-colors duration-300 ${
                        userVote === "down"
                            ? "text-red-500"
                            : "hover:text-red-500 text-gray-500"
                    }`}
                >
                    <FaArrowDown className="w-5 h-5 fill-current" />
                </button>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">
                        Posted by:{" "}
                        <Link href={`/profile/${post.user?.id}`} legacyBehavior>
                            <a className="text-blue-500 hover:underline">
                                {post.user?.username}
                            </a>
                        </Link>
                    </div>
                </div>
                <div className="text-xl font-bold mb-2">{post.title}</div>
                <p className="my-2">{post.content}</p>

                <PostImage post={post} />

                <div className="flex justify-between items-center text-sm mt-4">
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="hover:text-blue-500 transition-colors duration-300"
                        >
                            <FaComment className="w-5 h-5 fill-current" />
                        </button>
                        <span>{localComments.length}</span>
                    </div>
                </div>

                {showComments && (
                    <div className="mt-4 transition-all duration-300 ease-in-out">
                        {localComments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onVote={handleCommentVote}
                                currentUserId={user.id}
                                userVotes={commentVotes}
                            />
                        ))}
                        <CommentForm onSubmit={handleAddComment} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(PostItem);
