import React, { useEffect, useState } from "react";
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
import {Comment, NewComment} from './PostList'

interface PostItemProps {
    user: Tables<"profiles">;
    post: Post;
    addComment: (postId: string, comment: NewComment) => Promise<void>;
    upvotePost: (postId: string) => void;
    downvotePost: (postId: string) => void;
    editPost: (postId: string) => void;
}



const PostItem: React.FC<PostItemProps> = ({
    user,
    post,
    addComment,
    upvotePost,
    downvotePost,
    editPost,
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); // Assuming you have a way to toggle this
    const [openCommentId, setOpenCommentId] = useState<string | null>(null);

    const supabase = createClient();

    const getUser = async (userId: string) => {
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

    const getCommentUpvotesCount = async (commentId: string) => {
        const { data, error } = await supabase
            .from("commentUpvote")
            .select("id")
            .eq("comment_id", commentId);
        if (error) {
            console.error("Error fetching comment upvotes:", error);
            return 0;
        }
        return data.length;
    };

    const getCommentDownvotesCount = async (commentId: string) => {
        const { data, error } = await supabase
            .from("commentDownVote")
            .select("id")
            .eq("comment_id", commentId);
        if (error) {
            console.error("Error fetching comment downvotes:", error);
            return 0;
        }
        return data.length;
    };

    const processComments = async () => {
        const postComments = post.comments;

        if(!postComments) return;

        const newComments : Comment[] = await Promise.all(
            postComments.map(async (comment) => {
                const user = await getUser(comment.user_id!);
                const upvotes = await getCommentUpvotesCount(comment.id);
                const downvotes = await getCommentDownvotesCount(comment.id);
                return {
                    ...comment,
                    user,
                    votes: upvotes - downvotes
                };
            })
        );

        setComments(newComments);
    };

    useEffect(() => {
        processComments();
    }, []);

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommentText(e.target.value);
    };

    const handleAddComment = (e : React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const newComment: NewComment = {
            text: commentText,
            votes: 0, // Initialize votes to 0
            user_id: user.id,
            post_id: post.id,
        };
        addComment(post.id, newComment);
        setCommentText("");
    };

    const toggleComment = (commentId: string) => {
        setOpenCommentId(openCommentId === commentId ? null : commentId);
    };

    return (
        <div
            className={`flex border p-4 rounded-lg shadow-md mb-4 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-600"}`}
        >
            <div className="flex flex-col items-center space-y-1 mr-4">
                <button
                    onClick={() => upvotePost(post.id)}
                    className="hover:text-green-500 transition-colors duration-300"
                >
                    <FaArrowUp className="w-5 h-5 fill-current" />
                </button>
                <span>{post.votes}</span>
                <button
                    onClick={() => downvotePost(post.id)}
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
                    <button
                        onClick={() => editPost(post.id)}
                        className="hover:text-blue-500 transition-colors duration-300"
                    >
                        <FaEdit className="w-5 h-5 fill-current" />
                    </button>
                </div>
                <div className="text-xl font-bold mb-2">{post.title}</div>
                <p className="my-2">{post.content}</p>
                {post.image_data && (
                    <div className="mt-4">
                        <img
                            src={post.image_data as string}
                            alt="Post Image"
                            className="w-full h-auto max-w-xl max-h-96 rounded-md"
                        />
                    </div>
                )}
                {/* {post.gif && (
                    <div className="mt-4">
                        <img
                            src={post.gif as string}
                            alt="Post GIF"
                            className="w-full h-auto max-w-xl max-h-96 rounded-md"
                        />
                    </div>
                )} */}
                <div className="flex justify-between items-center text-sm mt-4">
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="hover:text-blue-500 transition-colors duration-300"
                        >
                            <FaComment className="w-5 h-5 fill-current" />
                        </button>
                        <span>{post.comments?.length}</span>
                    </div>
                </div>
                {showComments && (
                    <div className="mt-4 transition-all duration-300 ease-in-out">
                        {comments.map((comment) => (
                            <div key={comment.id} className="mb-2">
                                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => toggleComment(comment.id)}>
                                    <div className="text-sm">
                                        {comment.user?.username}
                                    </div>
                                    <div>{comment.content}</div>
                                </div>
                                {openCommentId === comment.id && (
                                    <div className="mt-2 ml-4 transition-all duration-300 ease-in-out">
                                        <div className="flex items-center space-x-1">
                                            <button className="hover:text-green-500 transition-colors duration-300">
                                                <FaArrowUp className="w-4 h-4 fill-current" />
                                            </button>
                                            <span>{comment.votes}</span>
                                            <button className="hover:text-red-500 transition-colors duration-300">
                                                <FaArrowDown className="w-4 h-4 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex items-center space-x-2 mt-2">
                            <input
                                type="text"
                                className={`border p-2 rounded-md w-full transition-colors duration-300 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-800"}`}
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={handleCommentChange}
                            />
                            <button
                                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                                onClick={handleAddComment}
                            >
                                Comment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostItem;
