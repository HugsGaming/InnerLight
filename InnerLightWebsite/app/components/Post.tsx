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

interface ModerationResponse {
    flagged: boolean;
    categories: {
        hate: boolean;
        ["hate/threatening"]: boolean;
        ["self-harm"]: boolean;
        ["sexual"]: boolean;
        ["sexual/minors"]: boolean;
        violence: boolean;
        ["violence/graphic"]: boolean;
    };
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
        isSubmitting: false,
    });

    const imageInputRef = useRef<HTMLInputElement>(null);
    const gifInputRef = useRef<HTMLInputElement>(null);

    const maxCharCount = 300;

    const checkContentModeration = async (
        text: string,
    ): Promise<ModerationResponse> => {
        try {
            const response = await fetch("/api/moderate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error("Failed to check content moderation");
            }

            return await response.json();
        } catch (error) {
            console.error("Moderation Error:", error);
            throw new Error("Content moderation check failed");
        }
    };

    const handleModeratedContent = (
        moderationResult: ModerationResponse,
    ): string | null => {
        if (!moderationResult.flagged) return null;

        const flaggedCategories = Object.entries(moderationResult.categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => category.replace("/", " or "));

        return `Content flagged for: ${flaggedCategories.join(", ")}. Please revise your post.`;
    };

    const resetForm = useCallback(() => {
        setFormState({
            title: "",
            description: "",
            charCount: 0,
            image: null,
            imageFile: null,
            gif: null,
            gifFile: null,
            isSubmitting: false,
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

        setFormState((prevState) => ({ ...prevState, isSubmitting: true }));

        try {
            // Check both title and description
            const [titleModeration, descriptionModeration] = await Promise.all([
                checkContentModeration(formState.title),
                checkContentModeration(formState.description),
            ]);

            const titleIssue = handleModeratedContent(titleModeration);
            const descriptionIssue = handleModeratedContent(
                descriptionModeration,
            );

            if (titleIssue || descriptionIssue) {
                toast.error(titleIssue || descriptionIssue);
                return;
            }

            const newPost: NewPost = {
                title: formState.title.trim(),
                description: formState.description.trim(),
                image: formState.imageFile,
                gif: formState.gifFile,
                user_id: user.id,
            };

            await addPost(newPost);
            resetForm();
            toast.success("Post created successfully");
        } catch (error) {
            toast.error("Failed to create post");
        } finally {
            setFormState((prevState) => ({
                ...prevState,
                isSubmitting: false,
            }));
        }
    }, [formState, user.id, addPost, resetForm]);

    const isMediaUploaded = formState.image !== null || formState.gif !== null;

    return (
        <div className="container mx-auto flex flex-col text-gray-800 dark:text-gray-200 mb-10">
            {/* Title Input */}
            <input
                className="title bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2 mb-4 outline-none text-black dark:text-white"
                spellCheck="false"
                placeholder="Title"
                type="text"
                value={formState.title}
                onChange={handleTitleChange}
                maxLength={100}
            />
            {/* Description Input */}
            <textarea
                className="description bg-gray-100 dark:bg-gray-800 sec p-3 h-50 border border-gray-300 dark:border-gray-600 outline-none text-black dark:text-white"
                spellCheck="false"
                placeholder="Describe everything about this post here"
                value={formState.description}
                onChange={handleDescriptionChange}
                maxLength={maxCharCount}
            ></textarea>

            {/* Image Preview */}
            {formState.image && (
                <div className="mt-4 relative">
                    <img
                        src={formState.image}
                        alt="Uploaded"
                        className="w-full h-auto rounded"
                    />
                    <button
                        onClick={() => removeMedia("image")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                        aria-label="Remove Image"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* GIF Preview */}
            {formState.gif && (
                <div className="mt-4 relative">
                    <img
                        src={formState.gif}
                        alt="Uploaded GIF"
                        className="w-full h-auto rounded"
                    />
                    <button
                        onClick={() => removeMedia("gif")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                        aria-label="Remove GIF"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Media Upload Icons */}
            <div className="icons flex text-gray-500 dark:text-gray-300 m-2 text-xl">
                <label
                    htmlFor="image-upload"
                    className={`mr-2 cursor-pointer transition-colors ${
                        isMediaUploaded
                            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            : "hover:text-gray-700 dark:hover:text-gray-400"
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
                            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            : "hover:text-gray-700 dark:hover:text-gray-400"
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
                <div className="count ml-auto text-gray-400 dark:text-gray-500 text-xs font-semibold">
                    {formState.charCount}/{maxCharCount}
                </div>
            </div>

            {/* Buttons */}
            <div className="buttons flex">
                <button
                    className="btn border border-gray-300 dark:border-gray-600 p-1 px-4 mr- font-semibold cursor-pointer text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 ml-auto rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    onClick={resetForm}
                    disabled={formState.isSubmitting}
                >
                    Cancel
                </button>
                <button
                    className="btn border border-green-500 p-1 px-4 font-semibold cursor-pointer text-white bg-green-500 rounded hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePost}
                    disabled={
                        !formState.title.trim() ||
                        !formState.description.trim() ||
                        formState.isSubmitting
                    }
                >
                    Post
                </button>
            </div>
        </div>
    );
};

export default Post;
