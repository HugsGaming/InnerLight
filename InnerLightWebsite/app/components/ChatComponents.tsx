import React, { useState } from "react";
import ChatListComponent from "./ChatListComponent";
import MessagesComponent from "./MessagesComponent";

interface Message {
    id: number;
    position: "left" | "right";
    type: "text" | "photo" | "file";
    title: string;
    text?: string;
    data?: { uri: string };
}

interface Chat {
    id: number;
    avatar: string;
    alt: string;
    title: string;
    subtitle: string;
    date: Date;
    unread: number;
    muted?: boolean;
    showMute?: boolean;
    showVideoCall?: boolean;
}

const initialChats: Chat[] = [
    {
        id: 1,
        avatar: "https://avatars.githubusercontent.com/u/80540635?v=4",
        alt: "kursat_avatar",
        title: "Kursat",
        subtitle: "Why don't we go to the No Way Home movie this weekend?",
        date: new Date(),
        unread: 3,
    },
    {
        id: 2,
        avatar: "https://avatars.githubusercontent.com/u/41473129?v=4",
        alt: "emre_avatar",
        title: "Emre",
        subtitle: "What are you doing?",
        date: new Date(),
        unread: 2,
        muted: true,
        showMute: true,
        showVideoCall: true,
    },
];

const initialMessages: Record<number, Message[]> = {
    1: [
        {
            id: 1,
            position: "left",
            type: "text",
            title: "Kursat",
            text: "Why don't we go to the No Way Home movie this weekend?",
        },
    ],
    2: [
        {
            id: 2,
            position: "left",
            type: "text",
            title: "Emre",
            text: "What are you doing?",
        },
    ],
};

const ChatComponent: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);

    const handleChatClick = (chat: Chat) => {
        setSelectedChat(chat.id);
        setMessages(initialMessages[chat.id] || []);
    };

    const handleSend = (message: Message) => {
        if (selectedChat !== null) {
            setMessages([...messages, message]);
            console.log("Message sent:", message);
        }
    };

    return (
        <div className="flex h-screen ">
            <ChatListComponent
                chats={initialChats}
                onChatClick={handleChatClick}
            />
            <MessagesComponent messages={messages} onSend={handleSend} />
        </div>
    );
};

export default ChatComponent;
