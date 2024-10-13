// components/Post.tsx
"use client"

import React, { useState } from "react";
import { FaImage, FaPoll, FaLink } from "react-icons/fa";
import { PiGifFill } from "react-icons/pi";

const Post: React.FC = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [charCount, setCharCount] = useState(0);
    const maxCharCount = 300;

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleDescriptionChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        setDescription(e.target.value);
        setCharCount(e.target.value.length);
    };

    const handlePost = () => {
        console.log("Post Submitted", { title, description });
        // Add post submission logic here
    };

    const handleCancel = () => {
        setTitle("");
        setDescription("");
    };

    return (
        <div className="container mx-auto flex flex-col text-gray-800 p-10">
            <input
                className="title bg-gray-100 border border-gray-300 p-2 mb-4 outline-none"
                spellCheck="false"
                placeholder="Title"
                type="text"
            />
            <textarea
                className="description bg-gray-100 sec p-3 h-50 border border-gray-300 outline-none"
                spellCheck="false"
                placeholder="Describe everything about this post here"
            ></textarea>

            <div className="icons flex text-gray-500 m-2">
                <FaImage className="mr-2 cursor-pointer hover:text-gray-700" />
                <PiGifFill className="mr-2 cursor-pointer hover:text-gray-700" />
                <FaLink className="mr-2 cursor-pointer hover:text-gray-700" />
                <FaPoll className="mr-2 cursor-pointer hover:text-gray-700" />
                <div className="count ml-auto text-gray-400 text-xs font-semibold">
                    0/300
                </div>
            </div>
            <div className="buttons flex">
                <div className="btn border border-gray-300 p-1 px-4 font-semibold cursor-pointer text-gray-500 ml-auto">
                    Cancel
                </div>
                <div className="btn border border-indigo-500 p-1 px-4 font-semibold cursor-pointer text-gray-200 ml-2 bg-indigo-500">
                    Post
                </div>
            </div>
        </div>
    );
};

export default Post;
