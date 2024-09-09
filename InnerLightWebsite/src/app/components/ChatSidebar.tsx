import React from "react";
import { chatData } from "./ChatData";

interface ChatSidebarProps {
    onSelectChat: (chatName: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectChat }) => {
    return (
        <div className=" bg-white dark:bg-gray-900 w-1/4 border-r dark:border-gray-700 p-4 m-1 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Groups
            </h2>
            {chatData.groups.map((chat, idx) => (
                <div
                    key={idx}
                    className="flex items-center justify-between p-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow cursor-pointer"
                    onClick={() => onSelectChat(chat.name)}
                >
                    <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                            {chat.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {chat.messages[chat.messages.length - 1]?.text ||
                                ""}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {chat.messages[chat.messages.length - 1]?.time ||
                                ""}
                        </p>
                    </div>
                </div>
            ))}

            <h2 className="text-lg font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">
                People
            </h2>
            {chatData.individuals.map((chat, idx) => (
                <div
                    key={idx}
                    className="flex items-center justify-between p-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow cursor-pointer"
                    onClick={() => onSelectChat(chat.name)}
                >
                    <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                            {chat.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {chat.messages[chat.messages.length - 1]?.text ||
                                ""}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {chat.messages[chat.messages.length - 1]?.time ||
                                ""}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatSidebar;
