import React, { FormEvent, useCallback, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { Plus, Search, Users, X } from "lucide-react";

interface Profile {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
}

export default function CreateChannelDialog({
    onChannelCreated,
    currentUser,
}: {
    onChannelCreated: (channel: any) => void;
    currentUser: { id: string; username: string; email: string };
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const supabase = useMemo(() => createClient(), []);

    const searchUsers = useCallback(
        async (query: string) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .or(`username.ilike.%${query}%`)
                    .or(`email.ilike.%${query}%`)
                    .limit(5);

                if (error) throw error;
                setSearchResults((data as Profile[]) || []);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setIsSearching(false);
            }
        },
        [currentUser.id],
    );

    const handleCreateChannel = async (e: FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;

        setIsLoading(true);
        try {
            // Create the channel
            const { data: channelData, error: channelError } = await supabase
                .from("messageChannels")
                .insert({
                    name: channelName.trim(),
                })
                .select()
                .single();

            if (channelError) throw channelError;

            // Add all selected users to the channel
            const userChannelInserts = [
                { channel_id: channelData.id, user_id: currentUser.id },
                ...selectedUsers.map((user) => ({
                    channel_id: channelData.id,
                    user_id: user.id,
                })),
            ];

            const { error: userChannelError } = await supabase
                .from("user_channels")
                .insert(userChannelInserts);

            if (userChannelError) throw userChannelError;

            onChannelCreated(channelData);
            setChannelName("");
            setSelectedUsers([]);
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating channel:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserSelect = (user: Profile) => {
        setSelectedUsers((prevUsers) => [...prevUsers, user]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const removeUser = (userId: string) => {
        setSelectedUsers((prevUsers) =>
            prevUsers.filter((user) => user.id !== userId),
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-2 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <Plus className="w-4 h-4" />
                <span>Create Channel</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Create New Channel
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        x
                    </button>
                </div>

                <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Channel Name"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="relative">
                        <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <Search className="w-4 h-4 ml-2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search users by username or email"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                className="w-full p-2 bg-transparent focus:outline-none"
                                disabled={isLoading}
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    >
                                        <div className="font-medium">
                                            {user.username}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full"
                                >
                                    <span className="text-sm">
                                        {user.username}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeUser(user.id)}
                                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !channelName.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creating..." : "Create Channel"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
