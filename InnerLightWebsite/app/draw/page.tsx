"use client";

import Head from "next/head";
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Canvas from "../components/Canvas";
import { Tables } from "../../database.types";
import { createClient } from "../utils/supabase/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FloatingEmotionDetection from "../components/new-emotion-detection/FloatingEmotionDetection";

const Draw: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [user, setUser] = useState<Tables<"profiles"> | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for canvas
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single();

                    if (profile) {
                        setUser(profile);
                    }
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

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

    // Don't render Canvas until we have user data
    if (isLoading) {
        return <div className="ml-14 mt-14 mb-10 md:ml-64">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                Please log in to access the canvas.
            </div>
        );
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
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <Canvas canvasRef={canvasRef} currentColor={""} user={user!} />
            </div>
            <FloatingEmotionDetection />
            <ToastContainer />
        </div>
    );
};

export default Draw;
