import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from "../../utils/supabase/client";
import { Search, UserPlus, Users, X } from 'lucide-react';

interface Profile {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
}

interface ChannelMembersProps {
    channelId: string;
    isOpen: boolean;
    onClose: () => void;
    currentUser: { id: string; username: string; email: string; };
}

export default function ManageChannelMember({ channelId, isOpen, onClose, currentUser }: ChannelMembersProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [channelMembers, setChannelMembers] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const supabase = useMemo(() => createClient(), []);

    // Fetch current channel members
    const fetchChannelMembers = useCallback(async () => {
        try {
            const {data, error} = await supabase
                .from('user_channels')
                .select(`
                    user_id,
                    profiles:profiles(*)    
                `)
                .eq('channel_id', channelId);

            if (error) throw error;

            const members = data.map((member) => member.profiles) as Profile[];
            setChannelMembers(members);
        } catch (error) {
            console.error('Error fetching channel members:', error);
        }
    }, [channelId, supabase]);

    useEffect(() => {
        if(isOpen) fetchChannelMembers();
    }, [isOpen, fetchChannelMembers]);

    const searchUsers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Get current member IDs to include them from search
            const memberIds = new Set(channelMembers.map((member) => member.id));

            const { data, error } = await supabase
                .from("profiles")
                .select('id, username, email, avatar_url')
                .or(`username.ilike.%${query}%`)
                .or(`email.ilike.%${query}%`)
                .not(`id`, 'in', `(${Array.from(memberIds).join(",")})`)
                .limit(5);
            if (error) throw error;
            setSearchResults(data as Profile[] || []);
        } catch (error) {
            console.error("Error searching users:", error);
        } finally {
            setIsSearching(false);
        }
    }, [channelMembers, supabase]);

    const addMember = async (user: Profile) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('user_channels')
                .insert({
                    channel_id: channelId,
                    user_id: user.id
                });

            if (error) throw error;

            setChannelMembers([...channelMembers, user]);
            setSearchResults([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Error adding member:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const removeMember = async (userId: string) => {
        if (userId === currentUser.id) {
            console.error('You cannot remove yourself from the channel.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('user_channels')
                .delete()
                .eq('channel_id', channelId)
                .eq('user_id', userId);

            if (error) throw error;

            // Update the local state
            setChannelMembers(channelMembers.filter((member) => member.id !== userId));
        } catch (error) {
            console.error('Error removing member:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if(!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center p-4 z-50'>
        <div className='bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md'>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='text-lg font-semibold flex items-center gap-2'>
                    <Users className='w-5 h-5' />
                    Manage Channel Members
                </h2>
                <button
                    onClick={onClose}
                    className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    >
                        x
                </button>
            </div>

            <div className='space-y-4'>
                <div className='relative'>
                    <div className='flex items-center border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'>
                        <Search className='w-4 h-4 ml-2 text-gray-500' />
                        <input
                            type='text'
                            placeholder='Search users to add'
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchUsers(e.target.value);
                            }}
                            className='w-full p-2 bg-transparent focus:outline-none'
                            disabled={isLoading}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className='absolute w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10'>
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => addMember(user)}
                                    className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                                >
                                    <div className='font-medium'>{user.username}</div>
                                    <div className='text-sm text-gray-500'>{user.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='mt-4'>
                    <h3 className='text-sm font-medium mb-2'>Current Members</h3>
                    <div className='space-y-2'>
                        {channelMembers.map((member) => (
                            <div
                                key={member.id}
                                className='flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg'
                            >
                                <div>
                                    <div className='font-medium'>{member.username}</div>
                                    <div className='text-sm text-gray-500'>{member.email}</div>
                                </div>
                                {member.id !== currentUser.id && (
                                    <button
                                        onClick={() => removeMember(member.id)}
                                        className='text-red-500 hover:text-red-600'>
                                        <X className='w-4 h-4' />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
