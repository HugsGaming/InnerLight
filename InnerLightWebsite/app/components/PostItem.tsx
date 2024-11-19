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
    }: {
        comment: Comment;
        onVote: (commentId: string, voteType: "up" | "down") => void;
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [localUpVotes, setLocalUpVotes] = useState(
            comment.upVotes_count![0]?.count || 0,
        );
        const [localDownVotes, setLocalDownVotes] = useState(
            comment.downVotes_count![0]?.count || 0,
        );

        const handleVote = (voteType: "up" | "down") => {
            if (voteType === "up") {
                setLocalUpVotes(localUpVotes + 1);
            } else {
                setLocalDownVotes(localDownVotes + 1);
            }
            onVote(comment.id, voteType);
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
                                    className="hover:text-green-500 transition-colors duration-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote("up");
                                    }}
                                >
                                    <FaArrowUp className="w-4 h-4 fill-current" />
                                </button>
                                <span>{voteCount}</span>
                                <button
                                    className="hover:text-red-500 transition-colors duration-300"
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
    const supabase = useMemo(() => createClient(), []);

    // Memoize ccomments data transformation
    const comments = useMemo(() => post.comments || [], [post.comments]);

    // Optimistic comment Voting
    const handleCommentVote = useCallback(
        async (commentId: string, voteType: "up" | "down") => {
            const table =
                voteType === "up" ? "commentUpVotes" : "commentDownVotes";
            try {
                const { error } = await supabase.from(table).insert({
                    comment_id: commentId,
                    user_id: user.id,
                });
                if (error) throw error;
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
        onVote(post.id, "up");
    }, [onVote, post.id]);

    const handleDownvote = useCallback(() => {
        onVote(post.id, "down");
    }, [onVote, post.id]);

    return (
        <div className="flex border p-4 rounded-lg shadow-md mb-4 transition-colors duration-300 bg-white dark:bg-gray-800 text-gray-600 dark:text-white">
            <div className="flex flex-col items-center space-y-1 mr-4">
                <button
                    onClick={handleUpvote}
                    className="hover:text-green-500 transition-colors duration-300"
                >
                    <FaArrowUp className="w-5 h-5  fill-current" />
                </button>
                <span>{postVoteCount}</span>
                <button
                    onClick={handleDownvote}
                    className="hover:text-red-500 transition-colors duration-300"
                >
                    <FaArrowDown className="w-5 h-5 fill-current" />
                </button>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">
                        Posted by: {post.user?.username}
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
                        <span>{comments.length}</span>
                    </div>
                </div>

                {showComments && (
                    <div className="mt-4 transition-all duration-300 ease-in-out">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onVote={handleCommentVote}
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
