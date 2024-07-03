// components/PostList.tsx
import React from "react";
import PostItem from "./PostItem";
import { FaHeart, FaComment } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";

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
        // Add more posts as needed
    ];

    return (
        <div className="container px-6 py-10 mx-auto bg-white dark:bg-gray-700">
            <div className="bg-white p-8 rounded-lg shadow-md dark:bg-gray-800 ">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <img
                            src="https://i.ibb.co/ZXTb2sh/1200px-Cat03.webp"
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full"
                        />
                        <div>
                            <p className="text-gray-800 font-semibold dark:text-white">
                                John Doe
                            </p>
                            <p className="text-gray-500 text-sm dark:text-white">
                                Posted 2 hours ago
                            </p>
                        </div>
                    </div>
                    <div className="text-gray-500 cursor-pointer">
                        <button className="hover:bg-gray-50 dark:hover:bg-gray-100 first-letter:rounded-full p-1">
                            <HiDotsVertical className="w-5 h-5 fill-current" />
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <p className="text-gray-800 dark:text-white">
                        Just another day with adorable kittens! 🐱{" "}
                        <a href="" className="text-blue-600 dark:text-white">
                            #CuteKitten
                        </a>
                        <a href="" className="text-blue-600 dark:text-white">
                            #AdventureCat
                        </a>
                    </p>
                </div>
                <div className="mb-4">
                    <img
                        src="https://i.ibb.co/ZXTb2sh/1200px-Cat03.webp"
                        alt="Post Image"
                        className="w-full h-48 object-cover rounded-md"
                    />
                </div>
                <div className="flex items-center justify-between text-gray-500 dark:text-white">
                    <div className="flex items-center space-x-2">
                        <button className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-400 rounded-full p-1">
                            <FaHeart className="w-5 h-5 fill-current" />
                            <span>42 Likes</span>
                        </button>
                    </div>
                    <button className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-400 rounded-full p-1">
                        <FaComment className="w-5 h-5 fill-current" />
                        <span>3 Comment</span>
                    </button>
                </div>
                <hr className="mt-2 mb-2" />
                <p className="text-gray-800 dark:text-white font-semibold">
                    Comment
                </p>
                <hr className="mt-2 mb-2" />
                <div className="mt-4">
                    <div className="flex items-center space-x-2">
                        <img
                            src="https://i.ibb.co/ZXTb2sh/1200px-Cat03.webp"
                            alt="User Avatar"
                            className="w-6 h-6 rounded-full"
                        />
                        <div>
                            <p className="text-gray-800 dark:text-white font-semibold">
                                Jane Smith
                            </p>
                            <p className="text-gray-500 dark:text-white text-sm">
                                Lovely shot! 📸
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <img
                            src="https://i.ibb.co/ZXTb2sh/1200px-Cat03.webp"
                            alt="User Avatar"
                            className="w-6 h-6 rounded-full"
                        />
                        <div>
                            <p className="text-gray-800 dark:text-white font-semibold">
                                Bob Johnson
                            </p>
                            <p className="text-gray-500 dark:text-white text-sm">
                                I can&apos;t handle the cuteness! Where can I get
                                one?
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 ml-6">
                        <img
                            src="https://i.ibb.co/ZXTb2sh/1200px-Cat03.webp"
                            alt="User Avatar"
                            className="w-6 h-6 rounded-full"
                        />
                        <div>
                            <p className="text-gray-800 dark:text-white font-semibold">
                                John Doe
                            </p>
                            <p className="text-gray-500 dark:text-white text-sm">
                                That little furball is from a local shelter. You
                                should check it out! 🏠😺
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostList;
