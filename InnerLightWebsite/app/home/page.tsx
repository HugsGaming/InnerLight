import Head from "next/head";
import React from "react";
import Sidebar from "../components/Sidebar";
import PostList from "../components/PostList";
import Header from "../components/Header";
import Post from "../components/Post";
import { createClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";

const Home: React.FC = () => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
        const { user } = data;
        if (!user || user === null) {
            redirect("/auth/login");
        } else {
            let metadata = user.user_metadata;
            console.log(metadata);
            const first_name = metadata.first_name;
            const last_name = metadata.last_name;
            const username = metadata.username;
            await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
                .then(async ({ data }) => {
                    console.log("Profile Data: ", data);
                    if (!data || data === null) {
                        try {
                            console.log(first_name, last_name, username);
                            const { data: profileData, error } = await supabase
                                .from("profiles")
                                .insert({
                                    first_name: first_name,
                                    last_name: last_name,
                                    username: username,
                                    email: user.email,
                                });
                            if (error) {
                                console.log(error);
                            } else {
                                console.log("Profile created");
                                const { data: logData, error } = await supabase
                                    .from("auditLogs")
                                    .insert({
                                        user_id: user.id,
                                        action_type: "Registration",
                                        add_info: null,
                                    });
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log("Log created");
                                }
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    } else {
                        await supabase.from("auditLogs").insert({
                            user_id: user.id,
                            action_type: "Login",
                            add_info: null,
                        });
                        console.log("Log created");
                    }
                });
        }
    });

    return (
        <div
            className={`min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white `}
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
