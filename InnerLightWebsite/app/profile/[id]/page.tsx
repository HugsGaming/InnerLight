import Head from "next/head";
import React from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "../../components/Profile";
import { QueryData } from "@supabase/supabase-js";
import { Post } from "../../components/PostList";

interface Props {
    params: {
        id: string;
    };
}

export default async function ProfilePage({ params: { id } }: Props) {
    const isDark = false; // Define the isDark variable
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    let profile;

    if (!user || user == null) {
        redirect("/auth/login");
    }

    if (user.id === id) {
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

    const postsWithCommentsAndVotesQuery = supabase
        .from("posts")
        .select(
            "*, comments(*, user:profiles(*), upVotes:commentUpVotes(*), upVotes_count:commentUpVotes(count), downVotes:commentDownVotes(*), downVotes_count:commentDownVotes(count)), downVotes:postDownVotes(*), downVotes_count:postDownVotes(count), upVotes:postUpVotes(*), upVotes_count:postUpVotes(count), user:profiles(*)",
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false });

    type PostWithCommentsAndVotes = QueryData<
        typeof postsWithCommentsAndVotesQuery
    >;

    const { data: postsData, error: postsError } =
        await postsWithCommentsAndVotesQuery;
    const posts = postsData as PostWithCommentsAndVotes;

    if (postsError) throw postsError;

    const { data: mediaPostsData, error: mediaPostsError } =
        await postsWithCommentsAndVotesQuery.filter("post_image", "neq", null);

    const mediaPosts = mediaPostsData as PostWithCommentsAndVotes;

    if (mediaPostsError) throw mediaPostsError;

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
                <Profile
                    user={profile!}
                    posts={posts as unknown as Post[]}
                    mediaPosts={mediaPosts as unknown as Post[]}
                />
            </div>
        </div>
    );
}
