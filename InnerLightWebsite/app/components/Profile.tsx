"use client";
import React, { useState } from "react";
import { Tables } from "../../database.types";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface ProfileProps {
    user: Tables<"profiles">;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [avatar, setAvatar] = useState(
        user.avatar_url ?? "/default-avatar.png",
    );
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [about, setAbout] = useState(user.about || "No bio available.");
    const [isEditingAbout, setIsEditingAbout] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAvatarChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const fileName = `${user.id}-${file.name}`;
            const { data, error } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { upsert: true });

            if (error) {
                console.error("Error uploading avatar:", error.message);
                return;
            }

            const publicURL = supabase.storage
                .from("avatars")
                .getPublicUrl(data.path).data.publicUrl;

            setAvatar(publicURL || "/default-avatar.png");
        }
    };

    const handleAvatarSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({ avatar_url: avatar })
            .eq("id", user.id);

        setIsSaving(false);
        if (error) {
            console.error("Error saving avatar:", error.message);
        } else {
            setIsEditingAvatar(false);
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
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg border border-gray-300">
            <div className="h-48 bg-yellow-600 rounded-t-lg flex items-center px-6 space-x-4 relative">
                <img
                    src={avatar}
                    alt={`${user.username}'s avatar`}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {isEditingAvatar ? (
                    <div className="absolute top-4 right-4">
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
                        <button
                            onClick={handleAvatarSave}
                            className="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
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
