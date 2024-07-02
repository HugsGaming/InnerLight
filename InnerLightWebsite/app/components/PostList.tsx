import React from "react";
import PostItem from "./PostItem";

const PostList: React.FC = () => {
    const posts = [
        {
            id: 1,
            title: "13 years ago today...",
            subreddit: "r/MURICA",
            votes: 13000,
            comments: 214,
            time: "6 hours ago",
        },
        {
            id: 2,
            title: "My cousin playing around...",
            subreddit: "r/Music",
            votes: 11700,
            comments: 850,
            time: "45 minutes ago",
        },
    ];

    return (
        <div className="container mx-auto py-4">
            <h1 className="text-2xl font-bold mb-4">
                Find something interesting to discuss
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                    <PostItem key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
};

export default PostList;
