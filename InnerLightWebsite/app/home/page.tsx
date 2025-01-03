import Head from "next/head";
import React, { use } from "react";
import Sidebar from "../components/Sidebar";
import PostList from "../components/PostList";
import Header from "../components/Header";
import { createClient } from "../utils/supabase/server";
import { QueryResult, QueryData } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import ButtonAiChat from "../components/ButtonAiChat";
import { toast, ToastContainer } from "react-toastify";
import { Post } from "../components/PostList";
import "react-toastify/dist/ReactToastify.css";
import dynamic from "next/dynamic";

const NewButtonAi = dynamic(
    () => import("../components/new-emotion-detection/NewButtonAi"),
    { ssr: false },
);

const Home: React.FC = async () => {
    const supabase = createClient();

    const postsWithCommentsAndVotesQuery = supabase
        .from("posts")
        .select(
            "*, comments(*, user:profiles(*), upVotes:commentUpVotes(*), upVotes_count:commentUpVotes(count), downVotes:commentDownVotes(*), downVotes_count:commentDownVotes(count)), downVotes:postDownVotes(*), downVotes_count:postDownVotes(count), upVotes:postUpVotes(*), upVotes_count:postUpVotes(count), user:profiles(*)",
        )
        .order("created_at", { ascending: false });

    type PostWithCommentsAndVotes = QueryData<
        typeof postsWithCommentsAndVotesQuery
    >;
    const {
        data: { user },
    } = await supabase.auth.getUser();
    let profile;

    if (!user || user == null) {
        redirect("/auth/login");
    } else {
        let metadata = user.user_metadata;
        console.log(metadata);
        const first_name = metadata.first_name;
        const last_name = metadata.last_name;
        const username =
            metadata.username ??
            metadata.first_name + "_" + metadata.last_name + "@" + user.id;
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
                                username:
                                    username ??
                                    `${first_name}_${last_name}@${user.id}`,
                                email: user.email!,
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
        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        if (profileError || profileData === null) {
            throw profileError;
        } else {
            profile = profileData;
        }
    }

    const { data: postsData, error: postsError } =
        await postsWithCommentsAndVotesQuery;
    if (postsError) {
        toast.error(postsError.message, { position: "top-right" });
        return;
    }
    const posts: PostWithCommentsAndVotes = postsData;
    console.log(posts);

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
            <ToastContainer />
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <PostList
                    user={profile!}
                    initialPosts={posts as unknown as Post[]}
                    showAddPost
                />
            </div>
            <NewButtonAi />
        </div>
    );
};

export default Home;
