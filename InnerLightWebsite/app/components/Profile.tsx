"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Tables } from "../../database.types";
import { toast } from 'react-toastify'

import { createClient } from '../utils/supabase/client'



interface ProfileProps {
    user: Tables<"profiles">;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
    
    const [avatar, setAvatar] = useState(
        user.avatar_url ?? "/default-avatar.png",
    );
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
    const [about, setAbout] = useState(user.about || "No bio available.");
    const [isEditingAbout, setIsEditingAbout] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

    const supabase = createClient();

    const downloadImage = useCallback(async () => {
        if (!user.avatar_url) {
            setIsLoadingAvatar(false);
            return;
        }
        try {
            const { data, error } = await supabase.storage
                .from("avatars")
                .download(user.avatar_url);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            setAvatarUrl(url);
        } catch (error) {
            toast.error("Error downloading image:", error.message);
        } finally {
            setIsLoadingAvatar(false);
        }
    }, [supabase, user.avatar_url]);

    useEffect(() => {
        if(user.avatar_url) {
            downloadImage();
        } else {
            setIsLoadingAvatar(false);
        }
    }, [user.avatar_url, downloadImage]);

    const handleAvatarChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            if(file.type !== "image/jpeg" && file.type !== "image/png") {
                toast.error("Only JPEG and PNG images are allowed.")
            } else {
                // Create a preview of the selected image
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewAvatar(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleAvatarSave = async () => {
        if (!previewAvatar) return;

        // Optimistic UI update
        const optimisticAvatarUrl = previewAvatar;
        setAvatarUrl(optimisticAvatarUrl);
        setIsEditingAbout(false);

        setIsSaving(true);

        try {
            // Convert base64 to file
            const response = await fetch(previewAvatar);
            const blob = await response.blob();
            const file = new File([blob], "avatar.jpg", { type: blob.type });

            const fileName = `${user.id}-${file.name}`;
            const { data, error } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, {
                    upsert: true,
                });

            if (error) throw error;

            const {error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: data?.path })
                .eq("id", user.id);

            if (updateError) throw updateError;

            toast.success("Avatar updated successfully!");
        } catch (error) {
            setAvatarUrl(user.avatar_url ?? "/default-avatar.png");
            setIsEditingAvatar(true);
            toast.error("Error updating avatar:", error.message);
        } finally {
            setIsSaving(false);
            setPreviewAvatar(null);
        }

        // Convert base64 to file
        const response = await fetch(previewAvatar);
        const blob = await response.blob();
        const file = new File([blob], "avatar.jpg", { type: blob.type });

        const fileName = `${user.id}-${file.name}`;
        const { data, error } = await supabase.storage
            .from("avatars")
            .upload(fileName, file, {
                upsert: true,
            });

        if (error) {
            toast.error(error.message);
            setIsSaving(false);
            return;
        }

        const {error: updateError } = await supabase
            .from("profiles")
            .update({ avatar_url: data?.path })
            .eq("id", user.id);

        setIsSaving(false);
        if (updateError) {
            toast.error(updateError.message);
        } else {
            setAvatarUrl(previewAvatar);
            setPreviewAvatar(null);
            setIsEditingAvatar(false);

            downloadImage();
        }
    };

    const handleAboutSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({ about })
            .eq("id", user.id);

        setIsSaving(false);
        if (error) {
            console.error("Error saving about section:", error.message);
        } else {
            setIsEditingAbout(false);
            toast.success("About section saved.");
        }
    };

    const cancelAvatarEdit = () => {
        setPreviewAvatar(null);
        setIsEditingAvatar(false);
    };

    if (isLoadingAvatar) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading profile...</p>
            </div>
        )
    }

    return (
        <div className="bg-white shadow-lg rounded-lg border border-gray-300">
            <div className="h-48 bg-yellow-600 rounded-t-lg flex items-center px-6 space-x-4 relative">
                <img
                    src={previewAvatar || avatarUrl || avatar}
                    alt={`${user.username}'s avatar`}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {isEditingAvatar ? (
                    <div className="absolute top-4 right-4 flex space-x-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                            id="avatarUpload"
                        />
                        <label
                            htmlFor="avatarUpload"
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded cursor-pointer"
                        >
                            Choose File
                        </label>
                        {previewAvatar && (
                            <>
                                <button
                                    onClick={handleAvatarSave}
                                    className="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={cancelAvatarEdit}
                                    className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded"
                                >
                                    Cancel
                                </button>
                                
                            </>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditingAvatar(true)}
                        className="absolute top-4 right-4 px-3 py-1 bg-gray-700 text-white text-sm rounded"
                    >
                        Edit Avatar
                    </button>
                )}

                <div>
                    <h1 className="text-3xl font-bold text-black">
                        {`${user.first_name} ${user.last_name}`}
                    </h1>
                    <p className="text-lg text-black">@{user.username}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex justify-center border-b border-gray-300">
                <button className="px-4 py-2 text-lg font-medium text-gray-700 hover:text-gray-900 focus:border-b-2 focus:border-blue-500">
                    Posts
                </button>
                <button className="px-4 py-2 text-lg font-medium text-gray-700 hover:text-gray-900 focus:border-b-2 focus:border-blue-500">
                    Media
                </button>
            </div>

            {/* About Section */}
            <div className="mt-6 px-6">
                <h2 className="text-xl font-semibold text-gray-900">About</h2>
                {isEditingAbout ? (
                    <div className="flex flex-col mt-3">
                        <textarea
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                        />
                        <button
                            onClick={handleAboutSave}
                            className="mt-3 px-4 py-2 bg-green-500 text-white rounded"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                ) : (
                    <p
                        className="text-gray-800 mt-3 cursor-pointer"
                        onClick={() => setIsEditingAbout(true)}
                    >
                        {about}
                    </p>
                )}
            </div>

            {/* Contact Section */}
            <div className="mt-6 px-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
                <p className="text-gray-800 mt-3">
                    {user.email || "No contact information available."}
                </p>
            </div>
        </div>
    );
};

export default Profile;
