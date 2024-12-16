import Head from "next/head";
import React from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "../../components/Profile";

interface Props {
    params: {
        id: string
    }
}

export default async function  ProfilePage({ params: { id } } : Props) {
    const isDark = false; // Define the isDark variable
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    let profile;

    if (!user || user == null) {
        redirect("/auth/login");
    }

    if(user.id === id) {
        redirect("/profile");
    }
    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
    if (profileError || profileData === null) {
        throw profileError;
    } else {
        profile = profileData;
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
            <ToastContainer />
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <Profile user={profile!} />
            </div>
        </div>
    );
}
