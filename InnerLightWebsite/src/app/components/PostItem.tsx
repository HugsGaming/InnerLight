import React from "react";

interface PostItemProps {
    post: {
        id: number;
        title: string;
        subreddit: string;
        votes: number;
        comments: number;
        time: string;
    };
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
    return (
        <div className="bg-white shadow-md p-4 rounded-md">
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">{post.subreddit}</div>
                <div className="text-sm text-gray-500">{post.time}</div>
            </div>
            <h2 className="text-lg font-bold my-2">{post.title}</h2>
            <div className="flex justify-between items-center text-sm text-gray-500">
                <div>{post.votes} votes</div>
                <div>{post.comments} comments</div>
            </div>
        </div>
    );
};

export default PostItem;
