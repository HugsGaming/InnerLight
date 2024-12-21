"use client";

import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";
import { produce } from "immer";
import {
    FiPhone,
    FiVideo,
    FiMoreHorizontal,
    FiPaperclip,
    FiSmile,
    FiMic,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { StringLike } from "bun";
import { EncryptionManager, encryptionManager } from "../utils/encryption/client";
import { Json } from "../../database.types";

// Types
interface ChatState {
    channels: MessageChannel[];
    selectedChannel: string;
    messages: Message[];
    currentUser: {
        id: string;
        username: string;
        email: string;
    } | null;
    page: number;
    hasMore: boolean;
    unreadMessages: {
        [channelId: string]: number;
    };
    isLoading?: boolean;
}

interface Profile {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email: string;
}

interface MessageChannel {
    id: string;
    name: string | null;
    created_at: string;
}

export interface Message {
    id: string;
    text_message: string | null;
    user_id: string | null;
    channel_id: string | null;
    created_at: string;
    type?: string | null;
    title?: string | null;
    data?: Json | null;
    user?: Profile | null;
}

export interface EncryptedMessage extends Message {
    encrypted_content: {
        iv: string;
        content: string;
    }
}

export interface InitialData {
    currentUser: {
        id: string;
        username: string;
        email: string;
    };
    channels: MessageChannel[];
    initialMessages: EncryptedMessage[];
    initialChannel: string;
    unreadCounts: { [channelId: string]: number };
}



// Memoized Sidebar component
const ChatSidebar = memo(
    ({
        chats,
        onSelectChat,
        unreadMessages,
    }: {
        chats: MessageChannel[];
        onSelectChat: (chatName: string) => void;
        unreadMessages: { [channelId: string]: number };
    }) => {
        const renderChats = useCallback(
            (chatList: MessageChannel[], title: string) => (
                <>
                    <h2 className="text-lg font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    {chatList.map((chat) => (
                        <div
                            key={chat.name}
                            className="relative flex items-center justify-between p-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => onSelectChat(chat.id!)}
                        >
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                    {chat.name}
                                </p>
                            </div>
                            {unreadMessages[chat.id] > 0 && (
                                <div className="ml-2 bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs px-1">
                                    {unreadMessages[chat.id]}
                                </div>
                            )}
                        </div>
                    ))}
                </>
            ),
            [onSelectChat, unreadMessages],
        );
        return (
            <div className="bg-white dark:bg-gray-900 w-1/4 border-r dark:border-gray-700 p-4 m-1 rounded-lg">
                {renderChats(chats, "Chats")}
            </div>
        );
    },
);

ChatSidebar.displayName = "ChatSidebar";

// Memoized Chat Window Component
const ChatWindow = memo(
    ({
        chatName,
        messages,
        state,
        onSendMessage,
        loadMoreMessages,
    }: {
        chatName: string;
        messages: Message[];
        state: ChatState;
        onSendMessage: (text: string) => void;
        loadMoreMessages: () => void;
    }) => {
        const [newMessage, setNewMessage] = useState("");
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const messagesContainerRef = useRef<HTMLDivElement>(null);
        const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
        const prevMessagesLengthRef = useRef(messages.length);
        const isInitialLoadRef = useRef(true);
        const loadingRef = useRef(false);

        const scollToBottom = useCallback(() => {
            if(messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        }, []);

        //Initial load scoll effect
        useEffect(() => {
            if(isInitialLoadRef.current && messages.length > 0) {
                scollToBottom();
                isInitialLoadRef.current = false;
            }
        }, [messages]);

        //Reset initial load flag when channel changes
        useEffect(() => {
            isInitialLoadRef.current = true;
            if(messages.length > 0) {
                scollToBottom();
            }
        }, [chatName]);

        //Handle auto scroll
        useEffect(() => {
            const currentLenth = messages.length;
            const prevLength = prevMessagesLengthRef.current;

            //If new messages were added (not loaded from history)
            if (currentLenth > prevLength && shouldScrollToBottom) {
                scollToBottom();
            }

            prevMessagesLengthRef.current = currentLenth;
        }, [messages]);

        const handleScroll = useCallback(() => {
            const container = messagesContainerRef.current;
            if (!container) return;

            //Calculate if we're near the bottom
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShouldScrollToBottom(isNearBottom);

            // Check if scrolled to top
            if (container.scrollTop <= 50 && state.hasMore && !state.isLoading && !loadingRef.current) {
                //Set loading flag
                loadingRef.current = true;

                // Save current scoll height
                const scrollHeightBefore = container.scrollHeight;

                loadMoreMessages();

                // After loading more messages, restore scroll position
                requestAnimationFrame(() => {
                    if(container) {
                        const newScollHeight = container.scrollHeight;
                        const scrollDiff = newScollHeight - scrollHeightBefore;
                        container.scrollTop = scrollDiff;

                        //Reset loading flag
                        setTimeout(() => {
                            loadingRef.current = false;
                        }, 1000); // Add a delay
                    }
                })
            }
        }, [loadMoreMessages, state.hasMore, state.isLoading]);

        //Group messages by date
        const groupedMessages = useMemo(() => {
            const groups: { [key: string]: Message[] } = {};

            messages.forEach((msg) => {
                const date = new Date(msg.created_at).toLocaleDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(msg);
            });

            return groups;
        }, [messages]);

        const handleSendMessage = useCallback(
            (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                if (newMessage.trim() === "") return;
                setShouldScrollToBottom(true);
                onSendMessage(newMessage);
                setNewMessage("");
            },
            [newMessage, onSendMessage],
        );

        return (
            <div className="flex-1 p-4 flex flex-col justify-between bg-white dark:bg-gray-900 m-1 rounded-lg">
                <div>
                    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {chatName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Online - Last seen, 2:02pm
                            </p>
                        </div>
                        <div className="flex space-x-3 text-gray-900 dark:text-gray-100">
                            <FiPhone />
                            <FiVideo />
                            <FiMoreHorizontal />
                        </div>
                    </div>
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto scrollbar h-[600px]"
                    >
                        {state.hasMore && state.isLoading && (
                            <div className="text-center text-gray-500 my-2">
                                Loading previous messages...
                            </div>
                        )}
                        {Object.entries(groupedMessages).map(
                            ([date, dateMessages]) => (
                                <div key={date}>
                                    <div className="text-center my-4 text-gray-500">
                                        <span className="px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            {date}
                                        </span>
                                    </div>
                                    {dateMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.user_id === state.currentUser?.id ? "justify-end" : "justify-start"} mb-4`}
                                        >
                                            <div
                                                className={`rounded-lg p-2 max-w-[70%] ${msg.user_id === state.currentUser?.id ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 dark:text-gray-100"}`}
                                            >
                                                <p>{msg.text_message}</p>
                                                <p className="text-xs text-right">
                                                    {new Date(
                                                        msg.created_at,
                                                    ).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ),
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                    <FiPaperclip className="mr-3 text-gray-900 dark:text-gray-100" />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 p-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    />
                    <FiSmile className="mr-3 text-gray-900 dark:text-gray-100" />
                    <button type="submit">
                        <FiMic className="text-gray-900 dark:text-gray-100" />
                    </button>
                </form>
            </div>
        );
    },
);

ChatWindow.displayName = "ChatWindow";

export default function ChatApplication({
    initialData
}: {
    initialData: InitialData
}) {
    const [state, setState] = useState<ChatState>({
        channels: initialData.channels,
        selectedChannel: initialData.initialChannel,
        messages: [], // Start Empty, will populate after decryption
        currentUser: initialData.currentUser,
        page: 1,
        hasMore: true,
        isLoading: false,
        unreadMessages: initialData.unreadCounts
    });

    const supabase = useMemo(() => createClient(), []);
    const encryptionManagerRef = useRef<EncryptionManager | null>(null);

    useEffect(() => {
        const initializeEncryption = async () => {
            try {
                const manager = new EncryptionManager();
                await manager.initialize(process.env.ENCRYPTION_PASSWORD!);
                encryptionManagerRef.current = manager;
    
                // Decrypt initial messages
                const decryptedMessages = await Promise.all(
                    initialData.initialMessages.map(async (message) => {
                        try {
                            const encryptedContent = typeof message.encrypted_content === 'string'
                                ? JSON.parse(message.encrypted_content)
                                : message.encrypted_content;
    
                            const decryptedContent = await manager.decrypt(encryptedContent);
                            return {
                                ...message,
                                text_message: decryptedContent
                            }
                        } catch (error) {
                            console.error('Decryption error:', error);
                            return {
                                ...message,
                                text_message: 'Failed to decrypt message'
                            }
                        }
                    })
                )

                setState((prev) => ({
                    ...prev,
                    messages: decryptedMessages.reverse()
                }))
            } catch (error) {
                console.error('Encryption initialization error:', error);
                toast.error('Failed to initialize encryption');
            }
        };

        initializeEncryption();
    }, [initialData.initialMessages]);

    //Mark Messages as Read
    const markMessagesAsRead = useCallback(
        async (channelId: string) => {
            if (!state.currentUser) return;

            const latestMessage = state.messages[state.messages.length - 1];
            if(!latestMessage) return;
            if(state.unreadMessages[channelId] === 0) return;

            try {
                const { error } = await supabase
                    .from('userReadMessages')
                    .upsert({
                        user_id: state.currentUser.id,
                        channel_id: channelId,
                        message_id: latestMessage.id,
                        last_read_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id, channel_id',
                    });

                if(error) {
                    console.error(error);
                    toast.error(error.message);
                    return
                }

                setState((prev) => ({
                    ...prev,
                    unreadMessages: {
                        ...prev.unreadMessages,
                        [channelId]: 0
                    },
                }))
            } catch (error) {
                
            }
        },
        [state.currentUser, state.messages, supabase],
    );

    //Listen for new messages
    useEffect(() => {
        if(!encryptionManagerRef.current) return;

        const messageSubscription = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    const encryptedMessage = payload.new as EncryptedMessage;

                    try {
                        // Parse the encrypted content if it's a string
                        const encryptedContent = typeof encryptedMessage.encrypted_content === 'string'
                            ? JSON.parse(encryptedMessage.encrypted_content)
                            : encryptedMessage.encrypted_content;

                        if(!encryptedContent || !encryptedContent.iv || !encryptedContent.content) throw new Error('Invalid encrypted content');

                        const decryptedMessage = await encryptionManagerRef.current!.decrypt({
                            iv: encryptedContent.iv,
                            content: encryptedContent.content
                        });

                        const newMessage = {
                            ...encryptedMessage,
                            text_message: decryptedMessage
                        }
                        
                        setState((prev) => {
                            // If new message is from the selected channel, add it to the messages array
                            if (newMessage.channel_id === state.selectedChannel) {
                                return {
                                    ...prev,
                                    messages: [...prev.messages, newMessage],
                                    unreadMessages: {
                                        ...prev.unreadMessages,
                                        [newMessage.channel_id]:
                                            // If the new message is from the current user, set the unread count to 0 else increment it
                                            newMessage.user_id === state.currentUser?.id
                                                ? prev.unreadMessages[newMessage.channel_id] || 0
                                                : (prev.unreadMessages[newMessage.channel_id] || 0) + 1
                                    }
                                }
                            }
    
                            return {
                                ...prev,
                                unreadMessages: {
                                    ...prev.unreadMessages,
                                    [newMessage.channel_id!]:
                                        // If the new message is from the current user, set the unread count to 0 else increment it
                                        newMessage.user_id === state.currentUser?.id
                                            ? prev.unreadMessages[newMessage.channel_id!] || 0
                                            : (prev.unreadMessages[newMessage.channel_id!] || 0) + 1
                                }
                            }
                        });
    
                        if(newMessage.channel_id === state.selectedChannel && newMessage.user_id !== state.currentUser?.id) {
                            await markMessagesAsRead(newMessage.channel_id);
                        }
                    } catch(error) {
                        console.error(error);
                        toast.error('Error decrypting message');
                    }

                    
                }
            )
            .subscribe();
        
        return () => {
            supabase.removeChannel(messageSubscription);
        }
    })

    const fetchMoreMessages = useCallback(async () => {
        if(!state.selectedChannel || !state.hasMore || state.isLoading) return;

        const pageSize = 20;

        try {
            setState((prev) => ({
                ...prev,
                isLoading: true
            }))

            let query = supabase
                .from('messages')
                .select('*, user:profiles(*)')
                .eq('channel_id', state.selectedChannel)
                .order('created_at', { ascending: true })

            if(state.messages.length > 0) {
                // Get the oldest message date
                const oldestMessageDate = state.messages[0].created_at;
                // Filter messages created after the oldest message
                query = query.lt('created_at', oldestMessageDate);
            }
            
            query = query.limit(pageSize);

            const { data, error } = await query;

            if(error) {
                console.error(error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false
                }))
                return;
            }

            if(!data || data.length === 0) {
                setState((prev) => ({
                    ...prev,
                    hasMore: false,
                    isLoading: false
                }));
                return;
            }
            try {
                // Decrypt messages
                const decryptedMessages = await Promise.all(
                    (data as EncryptedMessage[]).map(async (msg) => {
                        try {
                            const encryptedContent = typeof msg.encrypted_content === 'string'
                                ? JSON.parse(msg.encrypted_content)
                                : msg.encrypted_content;
    
                            if(!encryptedContent || !encryptedContent.iv || !encryptedContent.content) throw new Error('Invalid encrypted content');
    
                            const decryptedContent = await encryptionManagerRef.current!.decrypt({
                                iv: encryptedContent.iv,
                                content: encryptedContent.content
                            });
    
                            return {
                                ...msg,
                                text_message: decryptedContent
                            }
                        } catch (error) {
                            console.error('Decryption error:', error);
                            return {
                                ...msg,
                                text_message: 'Error decrypting message'
                            }
                        }
                    })
                );
        
                setState((prev) => ({
                    ...prev,
                    messages: [...decryptedMessages, ...prev.messages],
                    page: prev.page + 1,
                    hasMore: data.length === pageSize,
                    isLoading: false
                }))
            } catch (error) {
                console.error('Batch decryption error:', error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false
                }))
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                hasMore: false
            }))
        }        
    }, [state.selectedChannel, state.page, state.hasMore, state.isLoading, state.messages, supabase])

    //Select Channel Handler
    const selectChannel = useCallback(
        

        async (channelId: string) => {
            setState((prev) => ({
                ...prev,
                messages: [],
                selectedChannel: channelId,
                hasMore: true,
                isLoading: true,
                page: 1
            }))

            // Get the most recent 20 messages by ordering descending, then reverse
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    user:profiles(*)
                `)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: false }) // Get the most recent messages
                .limit(20);

            if(error) {
                console.error(error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false
                }));
                return;
            }

            try {
                // Decrypt the messages before setting them in state
                const decryptedMessages = await Promise.all(
                    (data as EncryptedMessage[]).map(async (msg) => {
                        try {
                            const encryptedContent = typeof msg.encrypted_content === 'string'
                                ? JSON.parse(msg.encrypted_content)
                                : msg.encrypted_content;

                            if(!encryptedContent || !encryptedContent.iv || !encryptedContent.content) throw new Error('Invalid encrypted content');

                            const decryptedContent = await encryptionManagerRef.current!.decrypt({
                                iv: encryptedContent.iv,
                                content: encryptedContent.content
                            });

                            return {
                                ...msg,
                                text_message: decryptedContent
                            }
                        } catch (error) {
                            console.error(error);
                            return {
                                ...msg,
                                text_message: 'Failed to decrypt message'
                            }
                        }
                    })
                );

                const orderedMessages = [...decryptedMessages].reverse();

                setState((prev) => ({
                    ...prev,
                    selectedChannel: channelId,
                    messages: orderedMessages,
                    page: 1,
                    hasMore: data.length === 20,
                    isLoading: false
                }));

                // Mark messages as read when switching to a new channel
                markMessagesAsRead(channelId);
            } catch(error) {
                console.error(error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false
                }));
            }
        },
        [markMessagesAsRead, supabase],
    );

    // Send Message Handler
    const sendMessage = useCallback(
        async (text: string) => {
            if (!state.currentUser || !state.selectedChannel) return;

            try {
                const encryptedContent = await encryptionManagerRef.current!.encrypt(text);
                const encryptedContentJson = JSON.stringify(encryptedContent);

                const { error } = await supabase
                .from("messages")
                .insert({
                    encrypted_content: encryptedContentJson,
                    user_id: state.currentUser.id,
                    channel_id: state.selectedChannel,
                    type: "text",
                    data: null,
                    title: null,
                })
                .select()
                .single();

                if (error) {
                    console.error(error);
                    toast.error('Failed to send message. Please try again.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to send message. Please try again.');
            }

            
        },
        [state.currentUser, state.selectedChannel, supabase],
    );

    return (
        <div className="flex flex-1 ml-14 mt-14 mb-10 md:ml-64 h-full">
            <ChatSidebar
                chats={state.channels}
                onSelectChat={selectChannel}
                unreadMessages={state.unreadMessages}
            />
            <ChatWindow
                chatName={state.selectedChannel}
                messages={state.messages}
                onSendMessage={sendMessage}
                state={state}
                loadMoreMessages={fetchMoreMessages}
            />
        </div>
    );
}
