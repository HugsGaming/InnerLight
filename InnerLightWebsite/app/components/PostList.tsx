// components/PostList.tsx
"use client";
import React, { useState } from "react";
import PostItem from "./PostItem";
import PostComponent from "./Post";

interface Post {
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
}

interface Comment {
    id: number;
    text: string;
    votes: number;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
    };
}

const PostList: React.FC<{
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
    };
}> = ({ user }) => {
    const [posts, setPosts] = useState<Post[]>([]);

    const addPost = (post: Post) => {
        setPosts([post, ...posts]);
        console.log("Post added:", post);
    };

    const addComment = (postId: number, comment: Comment) => {
        setPosts(
            posts.map((post) =>
                post.id === postId
                    ? { ...post, comments: [...post.comments, comment] }
                    : post,
            ),
        );
        console.log("Comment added:", comment);
    };

    const upvotePost = (postId: number) => {
        setPosts(
            posts.map((post) =>
                post.id === postId ? { ...post, votes: post.votes + 1 } : post,
            ),
        );
        console.log("Post upvoted:", postId);
    };

    const downvotePost = (postId: number) => {
        setPosts(
            posts.map((post) =>
                post.id === postId ? { ...post, votes: post.votes - 1 } : post,
            ),
        );
        console.log("Post downvoted:", postId);
    };

    const editPost = (postId: number) => {
        // Implement the editPost functionality here
        console.log("Edit post:", postId);
    };

    return (
        <div className="container px-6 py-10 mx-auto bg-white dark:bg-gray-700">
            <PostComponent addPost={addPost} user={user} />
            {posts.map((post) => (
                <PostItem
                    key={post.id}
                    post={post}
                    addComment={addComment}
                    upvotePost={upvotePost}
                    downvotePost={downvotePost}
                    editPost={editPost}
                />
            ))}
        </div>
    );
};

export default PostList;
