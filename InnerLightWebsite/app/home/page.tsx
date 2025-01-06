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

const FloatingEmotionDetection = dynamic(
    () =>
        import("../components/new-emotion-detection/FloatingEmotionDetection"),
    {
        ssr: false,
    },
);

const Home: React.FC = async () => {
    const supabase = createClient();

    const postsWithCommentsAndVotesQuery = supabase
        .from("posts")
        .select(
            "*, comments(*, user:profiles(*), upVotes:commentUpVotes(*), upVotes_count:commentUpVotes(count), downVotes:commentDownVotes(*), downVotes_count:commentDownVotes(count)), downVotes:postDownVotes(*), downVotes_count:postDownVotes(count), upVotes:postUpVotes(*), upVotes_count:postUpVotes(count), user:profiles(*)",
        )
        .order("created_at", { ascending: false })
        .range(0, 9);

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
        const { data: existingProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError && profileError.code === "PGRST116") {
            console.error("Error Fetching Profile:", profileError.message);
            throw profileError;
        }

        if (!existingProfile) {
            redirect("/auth/login");
        } else {
            // Onl log successful log in if profile exists
            await supabase.from("auditLogs").insert({
                user_id: user.id,
                action: "Login",
                add_info: {
                    provider: user.app_metadata?.provider
                        ? user.app_metadata.provider
                        : "Email Login",
                },
            });
            profile = existingProfile;
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
                    user={profile}
                    initialPosts={posts as unknown as Post[]}
                    showAddPost
                />
            </div>
            <FloatingEmotionDetection />
        </div>
    );
};

export default Home;
