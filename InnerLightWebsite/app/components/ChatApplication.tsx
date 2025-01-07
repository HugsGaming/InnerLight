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
import { FiSmile, FiSend, FiMenu } from "react-icons/fi";
import { toast } from "react-toastify";
import { EncryptionManager } from "../utils/encryption/client";
import { Json } from "../../database.types";
import { FileMetadata, FileService } from "../utils/encryption/fileservice";
import { Play, FileText, Download } from "lucide-react";
import { formatFileSize } from "../utils/files";
import ChatFileUploadPreview from "./ChatFileUploadPreview";
import { v4 as uuidv4 } from "uuid";
import EnhancedVideoPlayer from "./EnhancedVideoPlayer";
import CreateChannelDialog from "./chat/CreateChannelDialog";
import { UserPlus } from "lucide-react";
import ManageChannelMember from "./chat/ManageChannelMember";

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
    file_metadata?: FileMetadata;
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

// Memoized Chat Window Component
const ChatWindow = memo(
    ({
        chatName,
        messages,
        state,
        onSendMessage,
        onSendFile,
        loadMoreMessages,
        fileService,
    }: {
        chatName: string;
        messages: Message[];
        state: ChatState;
        onSendMessage: (text: string) => void;
        onSendFile: (file: File) => Promise<void>;
        loadMoreMessages: () => void;
        fileService: FileService;
    }) => {
        const [newMessage, setNewMessage] = useState("");
        const [isUploadingFile, setIsUploadingFile] = useState(false);
        const [decryptedFiles, setDecryptedFiles] = useState<{
            [key: string]: string;
        }>({});
        const [isDecrypting, setIsDecrypting] = useState<{
            [key: string]: boolean;
        }>({});
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const messagesContainerRef = useRef<HTMLDivElement>(null);
        const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
        const [isManagingMembers, setIsManagingMembers] = useState(false);
        const prevMessagesLengthRef = useRef(messages.length);
        const isInitialLoadRef = useRef(true);
        const loadingRef = useRef(false);

        const supabase = useMemo(() => {
            return createClient();
        }, []);

        type FileType = "image" | "video" | "file";

        const isValidFileType = (type: string): type is FileType => {
            return ["image", "video", "file"].includes(type);
        };

        const handleFileView = useCallback(
            async (msg: Message) => {
                // Validate file type
                if (msg.type && !isValidFileType(msg.type)) {
                    console.error(`Invalid file type: ${msg.type}`);
                    toast.error(`Invalid file type: ${msg.type}`);
                    return;
                }

                if (!msg.file_metadata?.encyptedUrl) return;

                try {
                    // Check if we already have decrypted this file
                    if (decryptedFiles[msg.id]) {
                        if (msg.type === "image") {
                            window.open(decryptedFiles[msg.id], "_blank");
                        }
                        return;
                    }

                    setIsDecrypting((prev) => ({
                        ...prev,
                        [msg.id]: true,
                    }));

                    const { data: encryptedData, error: downloadError } =
                        await supabase.storage
                            .from("chat-files")
                            .download(msg.file_metadata.encyptedUrl);

                    if (downloadError) throw downloadError;

                    const encryptedBlob = new Blob([encryptedData], {
                        type:
                            msg.type === "video"
                                ? "video/encrypted"
                                : "application/encrypted",
                    });

                    if (!msg.file_metadata) {
                        throw new Error("File metadata not found");
                    }

                    try {
                        // Choose appropriate preview method based on file type
                        const previewURL =
                            msg.type === "video"
                                ? await fileService.createVideoPreviewUrl(
                                      encryptedBlob,
                                      msg.file_metadata,
                                  )
                                : await fileService.createPreviewUrl(
                                      encryptedBlob,
                                      msg.file_metadata.fileType || "",
                                      msg.file_metadata,
                                  );

                        setDecryptedFiles((prev) => ({
                            ...prev,
                            [msg.id]: previewURL,
                        }));
                    } catch (error) {
                        console.error("Decryption error:", error);
                        throw new Error("Failed to decrypt file");
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to decrypt file!");
                } finally {
                    setIsDecrypting((prev) => ({
                        ...prev,
                        [msg.id]: false,
                    }));
                }
            },
            [fileService, supabase, decryptedFiles],
        );

        const scollToBottom = useCallback(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
            }
        }, []);

        //Initial load scoll effect
        useEffect(() => {
            if (isInitialLoadRef.current && messages.length > 0) {
                scollToBottom();
                isInitialLoadRef.current = false;
            }
        }, [messages]);

        //Reset initial load flag when channel changes
        useEffect(() => {
            isInitialLoadRef.current = true;
            if (messages.length > 0) {
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
            const isNearBottom =
                container.scrollHeight -
                    container.scrollTop -
                    container.clientHeight <
                100;
            setShouldScrollToBottom(isNearBottom);

            // Check if scrolled to top
            if (
                container.scrollTop <= 50 &&
                state.hasMore &&
                !state.isLoading &&
                !loadingRef.current
            ) {
                //Set loading flag
                loadingRef.current = true;

                // Save current scoll height
                const scrollHeightBefore = container.scrollHeight;

                loadMoreMessages();

                // After loading more messages, restore scroll position
                requestAnimationFrame(() => {
                    if (container) {
                        const newScollHeight = container.scrollHeight;
                        const scrollDiff = newScollHeight - scrollHeightBefore;
                        container.scrollTop = scrollDiff;

                        //Reset loading flag
                        setTimeout(() => {
                            loadingRef.current = false;
                        }, 1000); // Add a delay
                    }
                });
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

        const handleFileUpload = useCallback(
            async (file: File) => {
                try {
                    setIsUploadingFile(true);
                    await onSendFile(file);
                } finally {
                    setIsUploadingFile(false);
                }
            },
            [onSendFile],
        );

        const renderMessageContent = useCallback(
            (msg: Message) => {
                const isDecryptingFile = isDecrypting[msg.id];
                const decryptedUrl = decryptedFiles[msg.id];

                switch (msg.type) {
                    case "image":
                        return (
                            <div className="relative">
                                {isDecryptingFile ? (
                                    <div className="flex items-center justify-center p-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                                    </div>
                                ) : (
                                    <>
                                        <img
                                            src={
                                                msg.file_metadata?.thumbnailUrl
                                            }
                                            alt={msg.file_metadata?.fileName}
                                            className="rounded-lg max-w-full cursor-pointer"
                                        />
                                        <div className="text-xs mt-1">
                                            {msg.file_metadata?.fileName}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    case "video":
                        return (
                            <div className="relative w-full max-w-xl">
                                {decryptedUrl ? (
                                    <EnhancedVideoPlayer
                                        url={decryptedUrl}
                                        fileMetadata={msg.file_metadata!}
                                        isDecrypting={isDecryptingFile}
                                        onError={(error) => {
                                            console.error(
                                                "Video Playback Error:",
                                                error,
                                            );
                                            setDecryptedFiles((prevFiles) => {
                                                const newFiles = {
                                                    ...prevFiles,
                                                };
                                                delete newFiles[msg.id];
                                                return newFiles;
                                            });
                                        }}
                                    />
                                ) : (
                                    <button
                                        onClick={() => handleFileView(msg)}
                                        className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded"
                                    >
                                        <Play className="w-6 h-6" />
                                        <span>Click to load video</span>
                                    </button>
                                )}
                            </div>
                        );
                    case "file":
                        return (
                            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                <FileText className="w-6 h-6" />
                                <div>
                                    <div className="text-sm font-medium">
                                        {msg.file_metadata?.fileName}
                                    </div>
                                    <div className="text-xs">
                                        {formatFileSize(
                                            msg.file_metadata?.fileSize || 0,
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleFileView(msg)}
                                    disabled={isDecryptingFile}
                                    className="ml-auto text-blue-500 hover:text-blue-600 disabled:opacity-50"
                                >
                                    {isDecryptingFile ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                                    ) : (
                                        <Download className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        );
                    default:
                        return (
                            <p className="whitespace-pre-wrap">
                                {msg.text_message}
                            </p>
                        );
                }
            },
            [handleFileView, isDecrypting, decryptedFiles, formatFileSize],
        );

        const renderMessage = useCallback(
            (msg: Message) => {
                const isOwnMessage = msg.user_id === state.currentUser?.id;
                return (
                    <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
                    >
                        {!isOwnMessage && (
                            <div className="flex flex-col items-start mr-2">
                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    {msg.user?.username
                                        .charAt(0)
                                        .toUpperCase() || "?"}
                                </div>
                            </div>
                        )}

                        <div className="max-w-[60%]">
                            {!isOwnMessage && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 ml-1">
                                    {msg.user?.username || "Unknown User"}
                                </div>
                            )}

                            <div
                                className={`rounded-lg px-4 py-2 break-words ${
                                    isOwnMessage
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                }`}
                            >
                                {renderMessageContent(msg)}

                                <p className="text-xs text-right mt-2 opacity-75">
                                    {new Date(
                                        msg.created_at,
                                    ).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            },
            [state.currentUser, renderMessageContent],
        );

        return (
            <div className="h-full p-4 flex flex-col justify-between bg-white dark:bg-gray-900 m-1 rounded-lg">
                <div>
                    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {chatName || "Chat"}
                            </h2>
                            {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                                Online - Last seen, 2:02pm
                            </p> */}
                        </div>
                        <button
                            onClick={() => setIsManagingMembers(true)}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <UserPlus className="w-5 h-5" />
                        </button>

                        {/* <div className="flex space-x-3 text-gray-900 dark:text-gray-100">
                            <FiPhone />
                            <FiVideo />
                            <FiMoreHorizontal />
                        </div> */}
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
                                    {dateMessages.map(renderMessage)}
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
                    <div className="relative">
                        <ChatFileUploadPreview
                            onSend={handleFileUpload}
                            onCancel={() => {}}
                            isUploading={isUploadingFile}
                        />
                    </div>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 p-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    />
                    <FiSmile className="mr-3 text-gray-900 dark:text-gray-100" />
                    <button type="submit">
                        <FiSend className="text-gray-900 dark:text-gray-100" />
                    </button>
                </form>
                <ManageChannelMember
                    channelId={state.selectedChannel}
                    isOpen={isManagingMembers}
                    onClose={() => setIsManagingMembers(false)}
                    currentUser={state.currentUser!}
                />
            </div>
        );
    },
);

ChatWindow.displayName = "ChatWindow";

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
    const fileService = useMemo(
        () =>
            encryptionManagerRef.current
                ? new FileService(encryptionManagerRef.current)
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
            if (!state.currentUser || !state.selectedChannel || !fileService)
                return;

            try {
                // Generate encryption parameters
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const ivBase64 = Buffer.from(iv).toString("base64");

                if (file.type.startsWith("video/")) {
                    const { encryptedBlob, metadata } =
                        await fileService.encryptVideo(file, {
                            iv: ivBase64,
                        });

                    // Upload encrypted file
                    const fileName = `${uuidv4()}-${metadata.fileName}`;
                    const filePath = `${state.selectedChannel}/${fileName}`;

                    const { data: uploadData, error: uploadError } =
                        await supabase.storage
                            .from("chat-files")
                            .upload(filePath, encryptedBlob, {
                                contentType: "video/encrypted",
                            });

                    if (uploadError) {
                        console.error(uploadError);
                        toast.error("Failed to upload file. Please try again.");
                        return;
                    }

                    // Create message entry
                    const { error: messageError } = await supabase
                        .from("messages")
                        .insert({
                            user_id: state.currentUser.id,
                            channel_id: state.selectedChannel,
                            type: "video",
                            file_metadata: {
                                ...metadata,
                                encyptedUrl: uploadData?.path,
                            },
                        });

                    if (messageError) {
                        console.error(messageError);
                        toast.error("Failed to upload file. Please try again.");
                    }
                } else {
                    // Encrypt the file
                    const { encryptedBlob, metadata } =
                        await fileService.encryptFile(file, {
                            iv: ivBase64,
                        });

                    // Upload encrypted file
                    const fileName = `${uuidv4()}-${metadata.fileName}`;
                    const filePath = `${state.selectedChannel}/${fileName}`;

                    const { data: uploadData, error: uploadError } =
                        await supabase.storage
                            .from("chat-files")
                            .upload(filePath, encryptedBlob);

                    if (uploadError) {
                        console.error(uploadError);
                        toast.error("Failed to upload file. Please try again.");
                        return;
                    }

                    // Create message entry
                    const { error: messageError } = await supabase
                        .from("messages")
                        .insert({
                            user_id: state.currentUser.id,
                            channel_id: state.selectedChannel,
                            type: metadata.fileType.startsWith("image/")
                                ? "image"
                                : metadata.fileType.startsWith("video/")
                                  ? "video"
                                  : "file",
                            file_metadata: {
                                ...metadata,
                                encyptedUrl: uploadData?.path,
                                iv: ivBase64,
                            },
                        });

                    if (messageError) {
                        console.error("Error creating message:", messageError);
                        toast.error("Failed to send file. Please try again.");
                    }
                }
            } catch (error) {
                console.error("Error sending file:", error);
                toast.error("Failed to send file. Please try again.");
            }
        },
        [state.currentUser, state.selectedChannel, fileService, supabase],
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

    if (!fileService) {
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
                <ChatWindow
                    chatName={getChannelName(state.selectedChannel)!}
                    messages={state.messages}
                    onSendMessage={sendMessage}
                    onSendFile={handleFileSend}
                    state={state}
                    loadMoreMessages={fetchMoreMessages}
                    fileService={fileService}
                />
            </div>
        </div>
    );
}
