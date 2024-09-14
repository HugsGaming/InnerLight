"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatComponent from "../components/ChatComponents";

const App = () => {
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

    const [messages, setMessages] = useState<string[]>([]);

    type ChatMessageProps = {
        content: string;
        sender: string;
    };

    function handleSendMessage(message: ChatMessageProps): void {
        throw new Error("Function not implemented.");
    }

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
            <div className="p-10 ml-14 mt-10 md:ml-64 ">
                <ChatComponent />
            </div>
        </div>
    );
};

export default App;
