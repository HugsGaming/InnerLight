import React, { useState } from "react";
import {
    FaHeart,
    FaComment,
    FaArrowUp,
    FaArrowDown,
    FaEdit,
} from "react-icons/fa";

interface PostItemProps {
    post: {
        id: number;
        title: string;
        description: string;
        votes: number;
        comments: Comment[];
        image?: string;
        gif?: string;
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            username: string;
        };
    };
    addComment: (postId: number, comment: Comment) => void;
    upvotePost: (postId: number) => void;
    downvotePost: (postId: number) => void;
    editPost: (postId: number) => void;
}

interface Comment {
    id: number;
    text: string;
    votes: number; // Added votes property
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
    };
}

const PostItem: React.FC<PostItemProps> = ({
    post,
    addComment,
    upvotePost,
    downvotePost,
    editPost,
}) => {
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); // Assuming you have a way to toggle this
    const [openCommentId, setOpenCommentId] = useState<number | null>(null);

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommentText(e.target.value);
    };

    const handleAddComment = () => {
        const newComment: Comment = {
            id: Date.now(),
            text: commentText,
            votes: 0, // Initialize votes to 0
            user: post.user, // Assuming the commenter is the same user who posted
        };
        addComment(post.id, newComment);
        setCommentText("");
    };

    const toggleComment = (commentId: number) => {
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
                        Posted by: {post.user.username}
                    </div>
                    <button
                        onClick={() => editPost(post.id)}
                        className="hover:text-blue-500 transition-colors duration-300"
                    >
                        <FaEdit className="w-5 h-5 fill-current" />
                    </button>
                </div>
                <div className="text-xl font-bold mb-2">{post.title}</div>
                <p className="my-2">{post.description}</p>
                {post.image && (
                    <div className="mt-4">
                        <img
                            src={post.image}
                            alt="Post Image"
                            className="w-full h-auto max-w-xl max-h-96 rounded-md"
                        />
                    </div>
                )}
                {post.gif && (
                    <div className="mt-4">
                        <img
                            src={post.gif}
                            alt="Post GIF"
                            className="w-full h-auto max-w-xl max-h-96 rounded-md"
                        />
                    </div>
                )}
                <div className="flex justify-between items-center text-sm mt-4">
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="hover:text-blue-500 transition-colors duration-300"
                        >
                            <FaComment className="w-5 h-5 fill-current" />
                        </button>
                        <span>{post.comments.length}</span>
                    </div>
                </div>
                {showComments && (
                    <div className="mt-4 transition-all duration-300 ease-in-out">
                        {post.comments.map((comment) => (
                            <div key={comment.id} className="mb-2">
                                <div
                                    className="flex items-center space-x-2 cursor-pointer"
                                    onClick={() => toggleComment(comment.id)}
                                >
                                    <div className="text-sm">
                                        {comment.user.username} -
                                    </div>
                                    <div>{comment.text}</div>
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
