// components/Post.tsx
import React, { useState, useRef, useCallback, ChangeEvent } from "react";
import { FaImage, FaPoll, FaLink, FaTimes } from "react-icons/fa";
import { PiGifFill } from "react-icons/pi";
import { formatFileSize, validateFileSize } from "../utils/files";
import { toast } from "react-toastify";
import { Tables } from "../../database.types";
import { NewPost } from "./PostList";

interface PostProps {
    addPost: (post: NewPost) => Promise<void>;
    user: Tables<"profiles">;
}

const Post: React.FC<PostProps> = ({ addPost, user }) => {
    const [formState, setFormState] = useState({
        title: "",
        description: "",
        charCount: 0,
        image: null as string | null,
        imageFile: null as File | null,
        gif: null as string | null,
        gifFile: null as File | null,
    });

    const imageInputRef = useRef<HTMLInputElement>(null);
    const gifInputRef = useRef<HTMLInputElement>(null);

    const maxCharCount = 300;

    const resetForm = useCallback(() => {
        setFormState({
            title: "",
            description: "",
            charCount: 0,
            image: null,
            imageFile: null,
            gif: null,
            gifFile: null,
        });

        if (imageInputRef.current) imageInputRef.current.value = "";
        if (gifInputRef.current) gifInputRef.current.value = "";
    }, []);

    const handleTitleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setFormState((prevState) => ({
                ...prevState,
                title: e.target.value,
            }));
        },
        [],
    );

    const handleDescriptionChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            if (newValue.length <= maxCharCount) {
                setFormState((prevState) => ({
                    ...prevState,
                    description: newValue,
                    charCount: newValue.length,
                }));
            }
        },
        [],
    );

    const handleFileUpload = useCallback(
        (file: File | undefined, type: "image" | "gif") => {
            if (!file) return;

            if (type === "image" && (formState.image || formState.gif)) {
                toast.error("You can only upload one image");
                return;
            }

            if (type === "gif" && (formState.image || formState.gif)) {
                toast.error("You can only upload one gif");
                return;
            }

            if (type === "image" && !file.type.startsWith("image/")) {
                toast.error("File must be an image");
                return;
            }

            if (type === "gif" && !file.type.startsWith("image/gif")) {
                toast.error("File must be a gif");
                return;
            }

            if (!validateFileSize(file, 50)) {
                toast.error("File size must be less than 50MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState((prevState) => ({
                    ...prevState,
                    [type]: reader.result as string,
                    [`${type}File`]: file,
                }));
            };
            reader.readAsDataURL(file);
        },
        [formState.image, formState.gif],
    );

    const handleImageUpload = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            handleFileUpload(e.target.files?.[0], "image");
        },
        [handleFileUpload],
    );

    const handleGifUpload = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            handleFileUpload(e.target.files?.[0], "gif");
        },
        [handleFileUpload],
    );

    const removeMedia = useCallback((type: "image" | "gif") => {
        setFormState((prevState) => ({
            ...prevState,
            [type]: null,
            [`${type}File`]: null,
        }));

        if (type === "image" && imageInputRef.current)
            imageInputRef.current.value = "";
        if (type === "gif" && gifInputRef.current)
            gifInputRef.current.value = "";
    }, []);

    const handlePost = useCallback(async () => {
        if (!formState.title.trim() || !formState.description.trim()) {
            toast.error("Title and description are required");
            return;
        }

        const newPost: NewPost = {
            title: formState.title.trim(),
            description: formState.description.trim(),
            image: formState.imageFile,
            gif: formState.gifFile,
            user_id: user.id,
        };

        try {
            await addPost(newPost);
            resetForm();
        } catch (error) {
            toast.error("Failed to create post");
        }
    }, [formState, user.id, addPost, resetForm]);

    const isMediaUploaded = formState.image !== null || formState.gif !== null;

    return (
        <div className="container mx-auto flex flex-col text-gray-800 mb-10">
            <input
                className="title bg-gray-100 border border-gray-300 p-2 mb-4 outline-none"
                spellCheck="false"
                placeholder="Title"
                type="text"
                value={formState.title}
                onChange={handleTitleChange}
                maxLength={100}
            />
            <textarea
                className="description bg-gray-100 sec p-3 h-50 border border-gray-300 outline-none"
                spellCheck="false"
                placeholder="Describe everything about this post here"
                value={formState.description}
                onChange={handleDescriptionChange}
                maxLength={maxCharCount}
            ></textarea>

            {formState.image && (
                <div className="mt-4 relative">
                    <img
                        src={formState.image}
                        alt="Uploaded"
                        className="w-full h-auto rounded"
                    />
                    <button
                        onClick={() => removeMedia("image")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        aria-label="Remove Image"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {formState.gif && (
                <div className="mt-4 relative">
                    <img
                        src={formState.gif}
                        alt="Uploaded GIF"
                        className="w-full h-auto rounded"
                    />
                    <button
                        onClick={() => {
                            removeMedia("gif");
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        aria-label="Remove GIF"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <div className="icons flex text-gray-500 m-2 dark:text-white text-xl">
                <label
                    htmlFor="image-upload"
                    className={`mr-2 cursor-pointer transition-colors ${
                        isMediaUploaded
                            ? "text-gray-400 cursor-not-allowed"
                            : "hover:text-gray-700"
                    }`}
                >
                    <FaImage />
                </label>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageUpload}
                    disabled={isMediaUploaded}
                />
                <label
                    htmlFor="gif-upload"
                    className={`mr-2 cursor-pointer transition-colors ${
                        isMediaUploaded
                            ? "text-gray-400 cursor-not-allowed"
                            : "hover:text-gray-700"
                    }`}
                >
                    <PiGifFill />
                </label>
                <input
                    ref={gifInputRef}
                    type="file"
                    accept="image/gif"
                    className="hidden"
                    id="gif-upload"
                    onChange={handleGifUpload}
                    disabled={isMediaUploaded}
                />
                {/* <FaLink className="mr-2 cursor-pointer hover:text-gray-700" />
                <FaPoll className="mr-2 cursor-pointer hover:text-gray-700" /> */}
                <div className="count ml-auto text-gray-400 text-xs font-semibold">
                    {formState.charCount}/{maxCharCount}
                </div>
            </div>
            <div className="buttons flex">
                <button
                    className="btn border border-gray-300 p-1 px-4 font-semibold cursor-pointer text-gray-500 ml-auto rounded hover:bg-gray-100 transition-colors"
                    onClick={resetForm}
                >
                    Cancel
                </button>
                <button
                    className="btn border border-indigo-500 p-1 px-4 font-semibold cursor-pointer text-gray-200 ml-2 bg-indigo-500 rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePost}
                    disabled={
                        !formState.title.trim() || !formState.description.trim()
                    }
                >
                    Post
                </button>
            </div>
        </div>
    );
};

export default Post;
