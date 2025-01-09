import { Json } from "../../../database.types";
import { FileMetadata } from "../../utils/encryption/fileservice";
import { SecureFileMetadata } from "../../utils/encryption/secureFileService";

export interface MessageChannel {
    id: string;
    name: string | null;
    created_at: string;
}

export interface Profile {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email: string;
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

export interface ChatState {
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
