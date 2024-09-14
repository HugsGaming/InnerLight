// components/ChatListComponent.tsx

import React from "react";
import { ChatList } from "react-chat-elements";
import "react-chat-elements/dist/main.css";

interface Chat {
    id: number;
    avatar: string;
    alt: string;
    title: string;
    subtitle: string;
    date: Date;
    unread: number;
}

interface ChatListComponentProps {
    chats: Chat[];
    onChatClick: (chat: Chat) => void;
}

const ChatListComponent: React.FC<ChatListComponentProps> = ({
    chats,
    onChatClick,
}) => {
    return (
        <div className="w-1/3 bg-gray-200 p-4 border-r border-gray-300 dark:bg-gray-800">
            <ChatList
                className="chat-list  text-black dark:text-white dark:bg-gray-800"
                dataSource={chats}
                onClick={(item) => onChatClick(item as Chat)}
                id="chat-list"
                lazyLoadingImage="path/to/lazy-loading-image.png"
            />
        </div>
    );
};

export default ChatListComponent;
