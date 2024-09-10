import React, { useState } from "react";
import {
    FiPhone,
    FiVideo,
    FiMoreHorizontal,
    FiPaperclip,
    FiSmile,
    FiMic,
} from "react-icons/fi";

interface ChatWindowProps {
    chatName: string;
    messages: { sender: string; text: string; time: string }[];
    onSendMessage: (newMessage: {
        sender: string;
        text: string;
        time: string;
    }) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    chatName,
    messages,
    onSendMessage,
}) => {
    const [newMessage, setNewMessage] = useState("");

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        const newMsg = {
            sender: "me",
            text: newMessage,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }),
        };

        onSendMessage(newMsg);
        setNewMessage("");
    };

    return (
        <div className="flex-1 p-4 flex flex-col justify-between bg-white dark:bg-gray-900 m-1 rounded-lg">
            <div>
                <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {chatName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Online - Last seen, 2.02pm
                        </p>
                    </div>
                    <div className="flex space-x-3 text-gray-900 dark:text-gray-100">
                        <FiPhone />
                        <FiVideo />
                        <FiMoreHorizontal />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 scrollbar">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} mb-4`}
                        >
                            <div
                                className={`rounded-lg p-2 ${msg.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 dark:text-gray-100"}`}
                            >
                                <p>{msg.text}</p>
                                <p className="text-xs text-right">{msg.time}</p>
                            </div>
                        </div>
                    ))}
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
};

export default ChatWindow;
