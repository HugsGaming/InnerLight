import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createClient } from "../../utils/supabase/client";
import { FiSmile, FiSend } from "react-icons/fi";
import { UserPlus, Play, FileText, Download } from "lucide-react";
import { formatFileSize } from "../../utils/files";
import ChatFileUploadPreview from "../ChatFileUploadPreview";
import OptimizedVideoPlayer from "./OptimizedVideoPlayer";
import ManageChannelMember from "./ManageChannelMember";
import { Message, ChatState } from "./chat.types";
import {
    SecureFileService,
    SecureFileMetadata,
} from "../../utils/encryption/secureFileService";
import { toast } from "react-toastify";

interface ChatWindowProps {
    chatName: string;
    messages: Message[];
    state: ChatState;
    onSendMessage: (text: string) => void;
    onSendFile: (file: File) => Promise<void>;
    loadMoreMessages: () => void;
    fileService: SecureFileService;
}

function NewChatWindow({
    chatName,
    messages,
    state,
    onSendMessage,
    onSendFile,
    loadMoreMessages,
    fileService,
}: ChatWindowProps) {
    const [newMessage, setNewMessage] = useState("");
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [isManagingMembers, setIsManagingMembers] = useState(false);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);
    const isInitialLoadRef = useRef(true);
    const loadingRef = useRef(false);

    // Scroll handling logic
    const scrollToBottom = useCallback(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
        }
    }, []);

    // Initial load scroll effect
    useEffect(() => {
        if (isInitialLoadRef.current && messages.length > 0) {
            scrollToBottom();
            isInitialLoadRef.current = false;
        }
    }, [messages, scrollToBottom]);

    // Reset initial load flag when channel changes
    useEffect(() => {
        isInitialLoadRef.current = true;
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [chatName, scrollToBottom]);

    // Handle auto scroll
    useEffect(() => {
        const currentLength = messages.length;
        const prevLength = prevMessagesLengthRef.current;

        if (currentLength > prevLength && shouldScrollToBottom) {
            scrollToBottom();
        }

        prevMessagesLengthRef.current = currentLength;
    }, [messages, shouldScrollToBottom, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isNearBottom =
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
            100;
        setShouldScrollToBottom(isNearBottom);

        if (
            container.scrollTop <= 50 &&
            state.hasMore &&
            !state.isLoading &&
            !loadingRef.current
        ) {
            loadingRef.current = true;
            const scrollHeightBefore = container.scrollHeight;

            loadMoreMessages();

            requestAnimationFrame(() => {
                if (container) {
                    const newScrollHeight = container.scrollHeight;
                    const scrollDiff = newScrollHeight - scrollHeightBefore;
                    container.scrollTop = scrollDiff;

                    setTimeout(() => {
                        loadingRef.current = false;
                    }, 1000);
                }
            });
        }
    }, [loadMoreMessages, state.hasMore, state.isLoading]);

    // Group messages by date
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

    const handleFileDownload = useCallback(
        async (fileMetadata: SecureFileMetadata) => {
            try {
                const signedUrl =
                    await fileService.validateAccess(fileMetadata);
                const response = await fetch(signedUrl);
                const blob = await response.blob();

                // Decrypt the original file name
                const encryptedName = JSON.parse(fileMetadata.originalName);
                const fileName =
                    await fileService.encryptionManager.decrypt(encryptedName);

                // Create a download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click;
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("File download error:", error);
                toast.error("Failed to download file.");
            }
        },
        [fileService],
    );

    const renderMessageContent = useCallback(
        (msg: Message) => {
            const fileMetadata =
                typeof msg.file_metadata === "string"
                    ? (JSON.parse(msg.file_metadata) as SecureFileMetadata)
                    : msg.file_metadata;

            switch (msg.type) {
                case "video":
                    if (!fileMetadata) return null;
                    return (
                        <div className="relative w-full max-w-xl" key={msg.id}>
                            <OptimizedVideoPlayer
                                key={fileMetadata.storageUrl}
                                fileMetadata={fileMetadata}
                                onError={(error) => {
                                    console.error(
                                        "Video playback error:",
                                        error,
                                    );
                                    toast.error("Failed to play video");
                                }}
                            />
                        </div>
                    );
                case "image":
                    if (!fileMetadata) return null;
                    return (
                        <div className="relative">
                            <img
                                src={fileMetadata.thumbnailUrl}
                                alt={fileMetadata.fileName}
                                className="rounded-lg max-w-full cursor-pointer"
                                onClick={() =>
                                    msg.file_metadata &&
                                    handleFileDownload(msg.file_metadata)
                                }
                            />
                            <div className="text-xs mt-1">
                                {msg.file_metadata?.fileName}
                            </div>
                        </div>
                    );
                case "file":
                    if (!fileMetadata) return null;
                    return (
                        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <FileText className="w-6 h-6" />
                            <div>
                                <div className="text-sm font-medium">
                                    {fileMetadata.fileName}
                                </div>
                                <div className="text-xs">
                                    {formatFileSize(
                                        msg.file_metadata?.fileSize || 0,
                                    )}
                                </div>
                            </div>
                            <button
                                className="ml-auto text-blue-500 hover:text-blue-600"
                                onClick={() =>
                                    msg.file_metadata &&
                                    handleFileDownload(msg.file_metadata)
                                }
                            >
                                <Download className="w-5 h-5" />
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
        [handleFileDownload],
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
                                {msg.user?.username?.charAt(0).toUpperCase() ||
                                    "?"}
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
                                {new Date(msg.created_at).toLocaleTimeString()}
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
                    </div>
                    <button
                        onClick={() => setIsManagingMembers(true)}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <UserPlus className="w-5 h-5" />
                    </button>
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
}

NewChatWindow.displayName = "NewChatWindow";

export default memo(NewChatWindow);
