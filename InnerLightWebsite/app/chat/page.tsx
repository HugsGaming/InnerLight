"use client";

import React, { useEffect, useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import Head from "next/head";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { chatData } from "../components/ChatData";

const App = () => {
    const [selectedChat, setSelectedChat] = useState<string>("Friends Forever");
    const [chatMessages, setChatMessages] = useState<{
        [key: string]: { sender: string; text: string; time: string }[];
    }>({});

    useEffect(() => {
        const initializeChatMessages = () => {
            const initialMessages = chatData.groups
                .concat(chatData.individuals)
                .reduce(
                    (acc, chat) => {
                        acc[chat.name] = chat.messages;
                        return acc;
                    },
                    {} as {
                        [key: string]: {
                            sender: string;
                            text: string;
                            time: string;
                        }[];
                    },
                );

            setChatMessages(initialMessages);
        };

        initializeChatMessages();
    }, []);

    const handleSelectChat = (chatName: string) => {
        setSelectedChat(chatName);
    };

    const handleSendMessage = (newMessage: {
        sender: string;
        text: string;
        time: string;
    }) => {
        setChatMessages((prevMessages) => ({
            ...prevMessages,
            [selectedChat]: [...(prevMessages[selectedChat] || []), newMessage],
        }));
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const getTheme = () => {
            if (window.localStorage.getItem("dark")) {
                return JSON.parse(
                    window.localStorage.getItem("dark") as string,
                );
            }
            return (
                !!window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            );
        };

        const setTheme = (value: boolean) => {
            window.localStorage.setItem("dark", JSON.stringify(value));
            document.documentElement.classList.toggle("dark", value);
        };

        setIsDark(getTheme());
        setTheme(getTheme());
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div
            className={`min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white ${isDark ? "dark" : ""}`}
        >
            <Head>
                <script
                    src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.8.0/dist/alpine.min.js"
                    defer
                ></script>
            </Head>
            <Header />
            <Sidebar />
            <div className="flex flex-1 ml-14 mt-14 mb-10 md:ml-64 h-full">
                <ChatSidebar onSelectChat={handleSelectChat} />
                <ChatWindow
                    chatName={selectedChat}
                    messages={chatMessages[selectedChat] || []}
                    onSendMessage={handleSendMessage}
                />
            </div>
        </div>
    );
};

export default App;
