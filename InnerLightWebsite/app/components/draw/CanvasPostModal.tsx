import React, { useState, useCallback, RefObject, FormEvent } from "react";
import { Tables } from "../../../database.types";
import { ModerationResponse, NewPost } from "../post/post.types";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CanvasPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    canvasRef: RefObject<HTMLCanvasElement>;
    onSubmit: (post: NewPost) => Promise<void>;
    user: Tables<"profiles">;
}

export default function CanvasPostModal({
    isOpen,
    onClose,
    canvasRef,
    onSubmit,
    user,
}: CanvasPostModalProps) {
    const [formState, setFormState] = useState({
        title: "",
        description: "",
        charCount: 0,
        isSubmitting: false,
    });

    const maxCharCount = 300;

    const checkContentModeration = async (
        text: string,
    ): Promise<ModerationResponse> => {
        console.log("Starting moderation check for:", text);
        try {
            const response = await fetch("/api/moderate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                console.error(
                    "Moderation API error:",
                    response.status,
                    response.statusText,
                );
                throw new Error("Failed to check content moderation");
            }

            return await response.json();
        } catch (error) {
            console.error("Moderation Error:", error);
            throw new Error("Content moderation check failed");
        }
    };

    const handleModerationContent = async (
        moderationResult: ModerationResponse,
    ): Promise<string | null> => {
        console.log("Processing moderation result:", moderationResult);
        if (!moderationResult.flagged) return null;

        const flaggedCategories = Object.entries(moderationResult.categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => category.replace("/", " or "));

        return `Content flagged for: ${flaggedCategories.join(", ")}. Please revise your post.`;
    };

    const handleSubmit = async () => {
        if (!formState.title.trim() || !formState.description.trim()) {
            toast.error("Please enter a title and description.");
            return;
        }

        setFormState((prev) => ({ ...prev, isSubmitting: true }));

        try {
            // Check both title and description
            try {
                const [titleModeration, descriptionModeration] =
                    await Promise.all([
                        checkContentModeration(formState.title),
                        checkContentModeration(formState.description),
                    ]);

                const titleIssue =
                    await handleModerationContent(titleModeration);
                const descriptionIssue = await handleModerationContent(
                    descriptionModeration,
                );

                if (titleIssue || descriptionIssue) {
                    toast.error(titleIssue || descriptionIssue);
                    return;
                }
            } catch (moderationError) {
                console.warn("Moderation error:", moderationError);
            }

            //Convert canvas to blob
            type BlobCallback = (blob: Blob | null) => void;
            const canvasImage = await new Promise<Blob | null>(
                (resolve: BlobCallback) => {
                    if (!canvasRef.current) {
                        console.error("Canvas not initialized");
                        resolve(null);
                        return;
                    }

                    canvasRef.current.toBlob(
                        (blob) => resolve(blob),
                        "image/png",
                        1.0,
                    );
                },
            );

            if (!canvasImage) {
                throw new Error(
                    "Failed to get canvas image: Canvas conversion returned null",
                );
            }

            const imageFile = new File([canvasImage], "canvas-drawing.png", {
                type: "image/png",
                lastModified: Date.now(),
            });

            const newPost: NewPost = {
                title: formState.title.trim(),
                description: formState.description.trim(),
                image: imageFile,
                gif: null,
                user_id: user.id,
            };

            await onSubmit(newPost);

            onClose();
            setFormState({
                title: "",
                description: "",
                charCount: 0,
                isSubmitting: false,
            });

            toast.success("Post submitted successfully.");
        } catch (error) {
            console.error("Error submitting post:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Error submitting post.",
            );
        } finally {
            setFormState((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Post
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Title"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formState.title}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <textarea
                                placeholder="Description"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[100px]"
                                value={formState.description}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    if (newValue.length <= maxCharCount) {
                                        setFormState((prev) => ({
                                            ...prev,
                                            description: newValue,
                                            charCount: newValue.length,
                                        }));
                                    }
                                }}
                                maxLength={maxCharCount}
                            />
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                {formState.charCount}/{maxCharCount}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                disabled={formState.isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                    formState.isSubmitting ||
                                    !formState.title.trim() ||
                                    !formState.description.trim()
                                }
                            >
                                {formState.isSubmitting
                                    ? "Creating..."
                                    : "Create Post"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
