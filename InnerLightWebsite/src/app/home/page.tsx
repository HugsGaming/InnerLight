"use client";

import Head from "next/head";
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PostList from "../components/PostList";
import Header from "../components/Header";
import Post from "../components/Post";

const Home: React.FC = () => {
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
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <Post />
                <PostList />
            </div>
        </div>
    );
};

export default Home;
