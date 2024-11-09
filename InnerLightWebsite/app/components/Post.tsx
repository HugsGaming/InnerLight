// components/Post.tsx
import React, { useState } from "react";
import { FaImage, FaPoll, FaLink } from "react-icons/fa";
import { PiGifFill } from "react-icons/pi";
import { formatFileSize, validateFileSize } from "../utils/files";
import { toast } from "react-toastify";

interface Post {
    id: number;
    title: string;
    description: string;
    votes: number;
    comments: Comment[];
    image?: string | File;
    gif?: string | File;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string; // Add username field
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
        username: string; // Add username field
    };
}

const Post: React.FC<{
    addPost: (post: Post) => void;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
    }; // Add username field
}> = ({ addPost, user }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [charCount, setCharCount] = useState(0);
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [gif, setGif] = useState<string | null>(null);
    const [gifFile, setGifFile] = useState<File | null>(null);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith("image/")) {
                if (!validateFileSize(file, 50)) {
                    toast.error("File size must be less than 50MB");
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImage(reader.result as string);
                };
                reader.readAsDataURL(file);
                setImageFile(file);
                console.log(file);
            } else {
                toast.error("File must be an image");
            }
        }
    };

    const handleGifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGif(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePost = () => {
        const newPost: Post = {
            id: Date.now(),
            title,
            description,
            votes: 0,
            comments: [],
            image: imageFile || undefined,
            gif: gif || undefined,
            user: {
                ...user,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username, // Add username field
            },
        };
        addPost(newPost);
        setTitle("");
        setDescription("");
        setCharCount(0);
        setImage(null);
        setGif(null);
    };

    const handleCancel = () => {
        setTitle("");
        setDescription("");
        setCharCount(0);
        setImage(null);
        setGif(null);
    };

    return (
        <div className="container mx-auto flex flex-col text-gray-800 mb-10">
            <input
                className="title bg-gray-100 border border-gray-300 p-2 mb-4 outline-none"
                spellCheck="false"
                placeholder="Title"
                type="text"
                value={title}
                onChange={handleTitleChange}
            />
            <textarea
                className="description bg-gray-100 sec p-3 h-50 border border-gray-300 outline-none"
                spellCheck="false"
                placeholder="Describe everything about this post here"
                value={description}
                onChange={handleDescriptionChange}
            ></textarea>

            {image && (
                <div className="mt-4">
                    <img src={image} alt="Uploaded" className="w-full h-auto" />
                </div>
            )}

            {gif && (
                <div className="mt-4">
                    <img
                        src={gif}
                        alt="Uploaded GIF"
                        className="w-full h-auto"
                    />
                </div>
            )}

            <div className="icons flex text-gray-500 m-2 dark:text-white text-xl">
                <label
                    htmlFor="image-upload"
                    className="mr-2 cursor-pointer hover:text-gray-700"
                >
                    <FaImage />
                </label>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    onChange={handleImageUpload}
                />
                <label
                    htmlFor="gif-upload"
                    className="mr-2 cursor-pointer hover:text-gray-700 dark:text-white text-xl"
                >
                    <PiGifFill />
                </label>
                <input
                    type="file"
                    accept="image/gif"
                    style={{ display: "none" }}
                    id="gif-upload"
                    onChange={handleGifUpload}
                />
                {/* <FaLink className="mr-2 cursor-pointer hover:text-gray-700" />
                <FaPoll className="mr-2 cursor-pointer hover:text-gray-700" /> */}
                <div className="count ml-auto text-gray-400 text-xs font-semibold">
                    {charCount}/{maxCharCount}
                </div>
            </div>
            <div className="buttons flex">
                <div
                    className="btn border border-gray-300 p-1 px-4 font-semibold cursor-pointer text-gray-500 ml-auto"
                    onClick={handleCancel}
                >
                    Cancel
                </div>
                <div
                    className="btn border border-indigo-500 p-1 px-4 font-semibold cursor-pointer text-gray-200 ml-2 bg-indigo-500"
                    onClick={handlePost}
                >
                    Post
                </div>
            </div>
        </div>
    );
};

export default Post;
