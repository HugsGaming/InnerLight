"use client";

import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createClient } from "../utils/supabase/client";
import { toast } from "react-toastify";
import { EncryptionManager } from "../utils/encryption/client";
import { Json } from "../../database.types";
import CreateChannelDialog from "./chat/CreateChannelDialog";
import NewChatWindow from "./chat/NewChatWindow";
import {
    SecureFileMetadata,
    SecureFileService,
} from "../utils/encryption/secureFileService";

//Yes

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
    type?: "text" | "image" | "video" | "file";
    title?: string | null;
    data?: Json | null;
    file_metadata?: SecureFileMetadata;
    encrypted_content: {
        iv: string;
        content: string;
    };
    user?: Profile | null;
}

export interface EncryptedMessage extends Message {
    encrypted_content: {
        iv: string;
        content: string;
    };
}

export interface InitialData {
    currentUser: {
        id: string;
        username: string;
        email: string;
    };
    channels: MessageChannel[];
    initialMessages: Message[];
    initialChannel: string;
    unreadCounts: { [channelId: string]: number };
}

// Memoized Sidebar component
const ChatSidebar = memo(
    ({
        chats,
        onSelectChat,
        unreadMessages,
        onChannelCreated,
        currentUser,
    }: {
        chats: MessageChannel[];
        onSelectChat: (chatName: string) => void;
        unreadMessages: { [channelId: string]: number };
        onChannelCreated: (channel: MessageChannel) => void;
        currentUser: { id: string; username: string; email: string };
    }) => {
        const renderChats = useCallback(
            (chatList: MessageChannel[], title: string) => (
                <>
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    <CreateChannelDialog
                        onChannelCreated={onChannelCreated}
                        currentUser={currentUser}
                    />
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
            <div className="bg-white dark:bg-gray-900 w-full border-r dark:border-gray-700 p-4 m-1 rounded-lg h-full">
                {renderChats(chats, "Chats")}
            </div>
        );
    },
);

ChatSidebar.displayName = "ChatSidebar";

export default function ChatApplication({
    initialData,
}: {
    initialData: InitialData;
}) {
    const [state, setState] = useState<ChatState>({
        channels: initialData.channels,
        selectedChannel: initialData.initialChannel,
        messages: [], // Start Empty, will populate after decryption
        currentUser: initialData.currentUser,
        page: 1,
        hasMore: true,
        isLoading: false,
        unreadMessages: initialData.unreadCounts,
    });

    const supabase = useMemo(() => createClient(), []);
    const encryptionManagerRef = useRef<EncryptionManager | null>(null);
    const secureFileService = useMemo(
        () =>
            encryptionManagerRef.current
                ? new SecureFileService(encryptionManagerRef.current)
                : null,
        [encryptionManagerRef.current],
    );

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
                            if (message.type !== "text")
                                return {
                                    ...message,
                                    text_message: null,
                                };
                            const encryptedContent =
                                typeof message.encrypted_content === "string"
                                    ? JSON.parse(message.encrypted_content)
                                    : message.encrypted_content;

                            const decryptedContent =
                                await manager.decrypt(encryptedContent);
                            return {
                                ...message,
                                text_message: decryptedContent,
                            };
                        } catch (error) {
                            console.error("Decryption error:", error);
                            return {
                                ...message,
                                text_message: "Failed to decrypt message",
                            };
                        }
                    }),
                );

                setState((prev) => ({
                    ...prev,
                    messages: decryptedMessages.reverse(),
                }));
            } catch (error) {
                console.error("Encryption initialization error:", error);
                toast.error("Failed to initialize encryption");
            }
        };

        initializeEncryption();
    }, [initialData.initialMessages]);

    //Mark Messages as Read
    const markMessagesAsRead = useCallback(
        async (channelId: string) => {
            if (!state.currentUser) return;

            const latestMessage = state.messages[state.messages.length - 1];
            if (!latestMessage) return;
            if (state.unreadMessages[channelId] === 0) return;

            try {
                const { error } = await supabase
                    .from("userReadMessages")
                    .upsert(
                        {
                            user_id: state.currentUser.id,
                            channel_id: channelId,
                            message_id: latestMessage.id,
                            last_read_at: new Date().toISOString(),
                        },
                        {
                            onConflict: "user_id, channel_id",
                        },
                    );

                if (error) {
                    console.error(error);
                    toast.error(error.message);
                    return;
                }

                setState((prev) => ({
                    ...prev,
                    unreadMessages: {
                        ...prev.unreadMessages,
                        [channelId]: 0,
                    },
                }));
            } catch (error) {}
        },
        [state.currentUser, state.messages, supabase],
    );

    //Listen for new messages
    useEffect(() => {
        if (!encryptionManagerRef.current) return;

        const messageSubscription = supabase
            .channel("messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    const encryptedMessage = payload.new as Message;

                    try {
                        let newMessage: Message;
                        if (encryptedMessage.type === "text") {
                            // Parse the encrypted content if it's a string
                            const encryptedContent =
                                typeof encryptedMessage.encrypted_content ===
                                "string"
                                    ? JSON.parse(
                                          encryptedMessage.encrypted_content,
                                      )
                                    : encryptedMessage.encrypted_content;

                            if (
                                !encryptedContent ||
                                !encryptedContent.iv ||
                                !encryptedContent.content
                            )
                                throw new Error("Invalid encrypted content");

                            const decryptedMessage =
                                await encryptionManagerRef.current!.decrypt({
                                    iv: encryptedContent.iv,
                                    content: encryptedContent.content,
                                });

                            newMessage = {
                                ...encryptedMessage,
                                text_message: decryptedMessage,
                            };
                        } else {
                            newMessage = {
                                ...encryptedMessage,
                                text_message: null,
                            };
                        }

                        setState((prev) => {
                            // If new message is from the selected channel, add it to the messages array
                            if (
                                newMessage.channel_id === state.selectedChannel
                            ) {
                                return {
                                    ...prev,
                                    messages: [...prev.messages, newMessage],
                                    unreadMessages: {
                                        ...prev.unreadMessages,
                                        [newMessage.channel_id]:
                                            // If the new message is from the current user, set the unread count to 0 else increment it
                                            newMessage.user_id ===
                                            state.currentUser?.id
                                                ? prev.unreadMessages[
                                                      newMessage.channel_id
                                                  ] || 0
                                                : (prev.unreadMessages[
                                                      newMessage.channel_id
                                                  ] || 0) + 1,
                                    },
                                };
                            }

                            return {
                                ...prev,
                                unreadMessages: {
                                    ...prev.unreadMessages,
                                    [newMessage.channel_id!]:
                                        // If the new message is from the current user, set the unread count to 0 else increment it
                                        newMessage.user_id ===
                                        state.currentUser?.id
                                            ? prev.unreadMessages[
                                                  newMessage.channel_id!
                                              ] || 0
                                            : (prev.unreadMessages[
                                                  newMessage.channel_id!
                                              ] || 0) + 1,
                                },
                            };
                        });

                        if (
                            newMessage.channel_id === state.selectedChannel &&
                            newMessage.user_id !== state.currentUser?.id
                        ) {
                            await markMessagesAsRead(newMessage.channel_id);
                        }
                    } catch (error) {
                        console.error(error);
                        toast.error("Error decrypting message");
                    }
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "user_channels",
                    filter: `user_id=eq.${state.currentUser?.id}`,
                },
                async (payload) => {
                    try {
                        // Fetch the channel details
                        const { data, error } = await supabase
                            .from("messageChannels")
                            .select("*")
                            .eq("id", payload.new.channel_id)
                            .single();

                        if (error) throw error;

                        setState((prev) => ({
                            ...prev,
                            channels: [...prev.channels, data],
                            unreadMessages: {
                                ...prev.unreadMessages,
                                [data.id]: 0,
                            },
                        }));

                        // Show Notification
                        toast.info(`You have been added to ${data.name}`);
                    } catch (error) {
                        console.error(error);
                    }
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "user_channels",
                    filter: `user_id=eq.${state.currentUser?.id}`,
                },
                async (payload) => {
                    setState((prev) => ({
                        ...prev,
                        channels: prev.channels.filter(
                            (channel) => channel.id !== payload.old.channel_id,
                        ),
                        // If we're currently viewing the deleted channel, clear it
                        selectedChannel:
                            prev.selectedChannel === payload.old.channel_id
                                ? ""
                                : prev.selectedChannel,
                        messages:
                            prev.selectedChannel === payload.old.channel_id
                                ? []
                                : prev.messages,
                    }));
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    });

    const fetchMoreMessages = useCallback(async () => {
        if (!state.selectedChannel || !state.hasMore || state.isLoading) return;

        const pageSize = 20;

        try {
            setState((prev) => ({
                ...prev,
                isLoading: true,
            }));

            let query = supabase
                .from("messages")
                .select("*, user:profiles(*)")
                .eq("channel_id", state.selectedChannel)
                .order("created_at", { ascending: true });

            if (state.messages.length > 0) {
                // Get the oldest message date
                const oldestMessageDate = state.messages[0].created_at;
                // Filter messages created after the oldest message
                query = query.lt("created_at", oldestMessageDate);
            }

            query = query.limit(pageSize);

            const { data, error } = await query;

            if (error) {
                console.error(error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false,
                }));
                return;
            }

            if (!data || data.length === 0) {
                setState((prev) => ({
                    ...prev,
                    hasMore: false,
                    isLoading: false,
                }));
                return;
            }
            try {
                // Decrypt messages
                const decryptedMessages = await Promise.all(
                    (data as unknown as Message[]).map(async (msg) => {
                        try {
                            const encryptedContent =
                                typeof msg.encrypted_content === "string"
                                    ? JSON.parse(msg.encrypted_content)
                                    : msg.encrypted_content;

                            if (
                                !encryptedContent ||
                                !encryptedContent.iv ||
                                !encryptedContent.content
                            )
                                throw new Error("Invalid encrypted content");

                            const decryptedContent =
                                await encryptionManagerRef.current!.decrypt({
                                    iv: encryptedContent.iv,
                                    content: encryptedContent.content,
                                });

                            return {
                                ...msg,
                                text_message: decryptedContent,
                            };
                        } catch (error) {
                            console.error("Decryption error:", error);
                            return {
                                ...msg,
                                text_message: "Error decrypting message",
                            };
                        }
                    }),
                );

                setState((prev) => ({
                    ...prev,
                    messages: [...decryptedMessages, ...prev.messages],
                    page: prev.page + 1,
                    hasMore: data.length === pageSize,
                    isLoading: false,
                }));
            } catch (error) {
                console.error("Batch decryption error:", error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false,
                }));
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                hasMore: false,
            }));
        }
    }, [
        state.selectedChannel,
        state.page,
        state.hasMore,
        state.isLoading,
        state.messages,
        supabase,
    ]);

    //Select Channel Handler
    const selectChannel = useCallback(
        async (channelId: string) => {
            setState((prev) => ({
                ...prev,
                messages: [],
                selectedChannel: channelId,
                hasMore: true,
                isLoading: true,
                page: 1,
            }));

            // Get the most recent 20 messages by ordering descending, then reverse
            const { data, error } = await supabase
                .from("messages")
                .select(
                    `
                    *,
                    user:profiles(*)
                `,
                )
                .eq("channel_id", channelId)
                .order("created_at", { ascending: false }) // Get the most recent messages
                .limit(20);

            if (error) {
                console.error(error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false,
                }));
                return;
            }

            try {
                // Decrypt the messages before setting them in state
                const decryptedMessages = await Promise.all(
                    (data as unknown as Message[]).map(async (msg) => {
                        try {
                            if (msg.type !== "text")
                                return {
                                    ...msg,
                                    text_message: null,
                                };
                            const encryptedContent =
                                typeof msg.encrypted_content === "string"
                                    ? JSON.parse(msg.encrypted_content)
                                    : msg.encrypted_content;

                            if (
                                !encryptedContent ||
                                !encryptedContent.iv ||
                                !encryptedContent.content
                            )
                                throw new Error("Invalid encrypted content");

                            const decryptedContent =
                                await encryptionManagerRef.current!.decrypt({
                                    iv: encryptedContent.iv,
                                    content: encryptedContent.content,
                                });

                            return {
                                ...msg,
                                text_message: decryptedContent,
                            };
                        } catch (error) {
                            console.error(error);
                            return {
                                ...msg,
                                text_message: "Failed to decrypt message",
                            };
                        }
                    }),
                );

                const orderedMessages = [...decryptedMessages].reverse();

                setState((prev) => ({
                    ...prev,
                    selectedChannel: channelId,
                    messages: orderedMessages,
                    page: 1,
                    hasMore: data.length === 20,
                    isLoading: false,
                }));

                // Mark messages as read when switching to a new channel
                markMessagesAsRead(channelId);
            } catch (error) {
                console.error(error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasMore: false,
                }));
            }
        },
        [markMessagesAsRead, supabase],
    );

    // Get channel name
    const getChannelName = useCallback(
        (channelId: string) => {
            const channel = state.channels.find((c) => c.id === channelId);
            return channel ? channel.name : "Unnaded Chat";
        },
        [state.channels],
    );

    // Send Message Handler
    const sendMessage = useCallback(
        async (text: string) => {
            if (!state.currentUser || !state.selectedChannel) return;

            try {
                const encryptedContent =
                    await encryptionManagerRef.current!.encrypt(text);
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
                    toast.error("Failed to send message. Please try again.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to send message. Please try again.");
            }
        },
        [state.currentUser, state.selectedChannel, supabase],
    );

    const handleFileSend = useCallback(
        async (file: File) => {
            if (
                !state.currentUser ||
                !state.selectedChannel ||
                !secureFileService
            )
                return;

            try {
                // Process file with secure service
                const { processedFile, metadata } =
                    await secureFileService.processFile(file);

                // Generate thumbnail for images
                if (file.type.startsWith("image/")) {
                    const thumbnail =
                        await secureFileService.generateThumbnail(file);
                    if (thumbnail) metadata.thumbnailUrl = thumbnail;
                }

                const filePath = `${state.selectedChannel}/${processedFile.name}`;
                const { data: uploadData, error: uploadError } =
                    await supabase.storage
                        .from("chat-files")
                        .upload(filePath, processedFile);

                if (uploadError) {
                    console.error(uploadError);
                    toast.error("Failed to upload file. Please try again.");
                    return;
                }

                metadata.storageUrl = uploadData.path;

                const { error: messageError } = await supabase
                    .from("messages")
                    .insert({
                        user_id: state.currentUser.id,
                        channel_id: state.selectedChannel,
                        type: file.type.startsWith("image/")
                            ? "image"
                            : file.type.startsWith("video/")
                              ? "video"
                              : "file",
                        file_metadata: JSON.stringify(metadata),
                    });

                if (messageError) {
                    console.error(messageError);
                    toast.error("Failed to send file. Please try again.");
                }
            } catch (error) {
                console.error("Error sending file:", error);
                toast.error("Failed to send file. Please try again.");
            }
        },
        [state.currentUser, state.selectedChannel, secureFileService, supabase],
    );

    const handleChannelCreated = useCallback((newChannel: MessageChannel) => {
        setState((prev) => ({
            ...prev,
            channels: [...prev.channels, newChannel],
            selectedChannel: newChannel.id,
            messages: [],
            unreadMessages: {
                ...prev.unreadMessages,
                [newChannel.id]: 0,
            },
        }));
    }, []);

    if (!secureFileService) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row flex-1 ml-14 mt-14 mb-10 lg:ml-64">
            <div className="w-full lg:w-1/4">
                <ChatSidebar
                    chats={state.channels}
                    onSelectChat={selectChannel}
                    unreadMessages={state.unreadMessages}
                    onChannelCreated={handleChannelCreated}
                    currentUser={state.currentUser!}
                />
            </div>
            <div className="w-full lg:flex-1">
                <NewChatWindow
                    chatName={getChannelName(state.selectedChannel)!}
                    messages={state.messages}
                    onSendMessage={sendMessage}
                    onSendFile={handleFileSend}
                    state={state}
                    loadMoreMessages={fetchMoreMessages}
                    fileService={secureFileService}
                />
            </div>
        </div>
    );
}
