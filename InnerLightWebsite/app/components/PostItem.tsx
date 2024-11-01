import React, { useState } from "react";
import { FaHeart, FaComment, FaArrowUp, FaArrowDown } from "react-icons/fa";

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
}

interface Comment {
    id: number;
    text: string;
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
}) => {
    const [commentText, setCommentText] = useState("");

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommentText(e.target.value);
    };

    const handleAddComment = () => {
        const newComment: Comment = {
            id: Date.now(),
            text: commentText,
            user: post.user, // Assuming the commenter is the same user who posted
        };
        addComment(post.id, newComment);
        setCommentText("");
    };

    return (
        <div className="bg-white shadow-md p-4 rounded-md mb-4">
            <div className="text-sm text-gray-500">
                Posted by: {post.user.username}
            </div>
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">{post.title}</div>
                <div className="text-sm text-gray-500">{post.votes} votes</div>
            </div>
            <p className="text-gray-800 my-2">{post.description}</p>
            {post.image && (
                <div className="mt-4">
                    <img
                        src={post.image}
                        alt="Post Image"
                        className="w-full h-auto"
                    />
                </div>
            )}
            {post.gif && (
                <div className="mt-4">
                    <img
                        src={post.gif}
                        alt="Post GIF"
                        className="w-full h-auto"
                    />
                </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                    <button onClick={() => upvotePost(post.id)}>
                        <FaArrowUp className="w-5 h-5 fill-current" />
                    </button>
                    <button onClick={() => downvotePost(post.id)}>
                        <FaArrowDown className="w-5 h-5 fill-current" />
                    </button>
                    <span>{post.votes}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <FaComment className="w-5 h-5 fill-current" />
                    <span>{post.comments.length}</span>
                </div>
            </div>
            <div className="mt-4">
                {post.comments.map((comment) => (
                    <div
                        key={comment.id}
                        className="flex items-center space-x-2"
                    >
                        <div className="text-gray-800">{comment.text}</div>
                        <div className="text-sm text-gray-500">
                            - {comment.user.username}
                        </div>
                    </div>
                ))}
                <div className="flex items-center space-x-2 mt-2">
                    <input
                        type="text"
                        className="bg-gray-100 border border-gray-300 p-2 rounded-md w-full"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={handleCommentChange}
                    />
                    <button
                        className="bg-blue-500 text-white p-2 rounded-md"
                        onClick={handleAddComment}
                    >
                        Comment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostItem;
