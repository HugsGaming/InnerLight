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

// Types
interface ChatState {
    channels: MessageChannel[];
    selectedChannel: string;
    messages: Message[];
    currentUser: {
        id: string;
        username: string;
    } | null;
    page: number;
    hasMore: boolean;
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

interface Message {
    id: string;
    text_message: string | null;
    user_id: string | null;
    channel_id: string | null;
    created_at: string;
    type?: string | null;
    title?: string | null;
    data?: JSON | null;
    user?: Profile;
}

// Memoized Sidebar component
const ChatSidebar = memo(
    ({
        chats,
        selectedChat,
        onSelectChat,
    }: {
        chats: MessageChannel[];
        selectedChat: string;
        onSelectChat: (chatName: string) => void;
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
                            className="flex items-center justify-between p-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow cursor-pointer"
                            onClick={() => onSelectChat(chat.id!)}
                        >
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                    {chat.name}
                                </p>
                                {/* <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {chat.messages[chat.messages.length - 1]
                                        ?.text || ""}
                                </p>
                                <div className="text-right">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {chat.messages[chat.messages.length - 1]
                                            ?.time || ""}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    ))}
                </>
            ),
            [selectedChat, onSelectChat],
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

        useEffect(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, [messages]);

        const handleScroll = useCallback(() => {
            const container = messagesContainerRef.current;
            if (!container) return;

            // Check if scrolled to top
            if (container.scrollTop === 0 && state.hasMore) {
                loadMoreMessages();
            }
        }, [loadMoreMessages, state.hasMore]);

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
                        {state.hasMore && (
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

export default function ChatApplication() {
    const [state, setState] = useState<ChatState>({
        channels: [],
        selectedChannel: "",
        messages: [],
        currentUser: null,
        page: 1,
        hasMore: true,
    });
    const router = useRouter();

    const supabase = useMemo(() => createClient(), []);

    //Initial User And Channels Fetch
    useEffect(() => {
        async function fetchUserAndChannels() {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();
            if (error || !user) {
                router.replace("/auth/login");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError || !profile) {
                router.replace("/auth/login");
                return;
            }

            const { data: channelsData, error: channelsError } = await supabase
                .from("user_channels")
                .select("messageChannels(id, name, created_at)")
                .eq("user_id", user.id);

            const channels =
                channelsData?.map(
                    (channel) => channel.messageChannels as MessageChannel,
                ) ?? [];

            if (channelsError || !channelsData) {
                console.error(channelsError);
                return;
            }

            setState((prev) => ({
                ...prev,
                currentUser: {
                    id: profile.id,
                    username: profile.username,
                },
                channels,
                selectedChannel: channels[0]?.id || "",
                page: 1,
                hasMore: true,
            }));
        }

        fetchUserAndChannels();
    }, []);

    const fetchChannelMessages = useCallback(
        async (channelId: string, page: number = 1) => {
            const pageSize = 20; // Number of messages to load per page
            const { data, error } = await supabase
                .from("messages")
                .select(
                    `*,
                user:profiles(id, username, avatar_url)    
            `,
                )
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (error) {
                console.error(error);
                return { messages: [], hasMore: false };
            }

            return {
                messages: data as Message[],
                hasMore: data.length === pageSize,
            };
        },
        [supabase],
    );

    //Load more messages for infinite scroll
    const loadMoreMessages = useCallback(async () => {
        if (!state.selectedChannel || !state.hasMore) return;

        const { messages, hasMore } = await fetchChannelMessages(
            state.selectedChannel,
            state.page + 1,
        );

        setState((prev) => ({
            ...prev,
            messages: [...messages, ...prev.messages],
            page: prev.page + 1,
            hasMore,
        }));
    }, [
        state.selectedChannel,
        state.page,
        state.hasMore,
        fetchChannelMessages,
    ]);

    //Initial Messages fetch and channel messages sync
    useEffect(() => {
        if (state.selectedChannel) {
            async function initialMessagesFetch() {
                const { messages, hasMore } = await fetchChannelMessages(
                    state.selectedChannel,
                    1,
                );

                setState((prev) => ({
                    ...prev,
                    messages,
                    page: 1,
                    hasMore,
                }));
            }
            initialMessagesFetch();

            //Real-time message subscription
            const messageSubscription = supabase
                .channel("messages")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                    },
                    (payload) => {
                        if (payload.new.channel_id === state.selectedChannel) {
                            setState((prev) => ({
                                ...prev,
                                messages: [
                                    ...prev.messages,
                                    payload.new as Message,
                                ],
                            }));
                        }
                    },
                )
                .subscribe();

            return () => {
                supabase.removeChannel(messageSubscription);
            };
        }
    }, [state.selectedChannel, fetchChannelMessages]);

    //Select Channel Handler
    const selectChannel = useCallback((channelId: string) => {
        setState((prev) => ({
            ...prev,
            selectedChannel: channelId,
            messages: [],
            page: 1,
            hasMore: true
        }));
    }, []);

    // Send Message Handler
    const sendMessage = useCallback(
        async (text: string) => {
            if (!state.currentUser || !state.selectedChannel) return;

            const { error } = await supabase
                .from("messages")
                .insert({
                    text_message: text,
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
            }
        },
        [state.currentUser, state.selectedChannel],
    );

    return (
        <div className="flex flex-1 ml-14 mt-14 mb-10 md:ml-64 h-full">
            <ChatSidebar
                chats={state.channels}
                selectedChat={state.selectedChannel}
                onSelectChat={selectChannel}
            />
            <ChatWindow
                chatName={state.selectedChannel}
                messages={state.messages}
                onSendMessage={sendMessage}
                state={state}
                loadMoreMessages={loadMoreMessages}
            />
        </div>
    );
}
