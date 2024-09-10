"use client";

import Head from "next/head";
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PostList from "../components/PostList";
import Header from "../components/Header";
import Post from "../components/Post";
import { createClient } from "../utils/supabase/client";
import { redirect, useRouter } from "next/navigation";

const Home: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            const { user } = data;
            if (!user || user === null) {
                router.replace("/auth");
            } else {
                let metadata = user.user_metadata;
                console.log(metadata);
                const first_name = metadata.first_name;
                const last_name = metadata.last_name;
                const username = metadata.username;
                // supabase.from('profiles').select("*").eq('user_id', user.id).single().then(({data}) => {
                //     if(!data || data === null) {
                //         supabase.from('profiles').insert({
                //             user_id: user.id,
                //             first_name: first_name,
                //             last_name: last_name,
                //             username: username
                //         })
                //     }
                // });
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", user.id);
                console.log(data);
                if (!data || data === null || data.length === 0) {
                    await supabase
                        .from("profiles")
                        .insert({
                            user_id: user.id,
                            first_name: first_name,
                            last_name: last_name,
                            username: username,
                            email: user.email,
                        })
                        .select();
                    console.log("No profile found, created new profile");
                } else {
                    console.error(error);
                }
            }
        });
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
