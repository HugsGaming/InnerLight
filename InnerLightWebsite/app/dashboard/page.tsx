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
import {
    FaHeart,
    FaSmile,
    FaLeaf,
    FaUserMd,
    FaPaintBrush,
    FaPenNib,
    FaRobot,
    FaShieldAlt,
} from "react-icons/fa";

const FloatingEmotionDetection = dynamic(
    () =>
        import("../components/new-emotion-detection/FloatingEmotionDetection"),
    {
        ssr: false,
    },
);

const Dashboard: React.FC = async () => {
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

    return (
        <div className="min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white">
            <Header />
            <Sidebar />
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <div className="min-h-screen bg-white dark:bg-gray-800 text-black dark:text-white">
                    {/* Hero Section with Image Left & Text Right */}
                    <header className="flex flex-col lg:flex-row items-center justify-center min-h-[400px] md:min-h-[500px] bg-gray-100 dark:bg-gray-900">
                        {/* Left: Hero Image */}
                        <div className="lg:w-1/2 w-full h-full">
                            <img
                                src="https://imgur.com/ouxrWGA.jpg"
                                alt="Mental Health Awareness"
                                className="w-full h-auto object-cover"
                            />
                        </div>

                        {/* Right: Hero Text */}
                        <div className="lg:w-1/2 w-full px-6 md:px-10 flex flex-col justify-center text-center lg:text-left">
                            <h1 className="text-3xl md:text-5xl font-bold text-[#1E3226] dark:text-blue-200">
                                DRAW, WRITE & CHAT!
                            </h1>
                            <p className="mt-3 text-lg text-gray-700 dark:text-gray-300 mb-10">
                                A safe space to share your creativity and
                                enhance mental well-being.
                            </p>
                        </div>
                    </header>

                    {/* Features Section */}
                    <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-10">
                        <FeatureCard
                            icon={<FaPaintBrush />}
                            title="Share Your Art"
                            desc="Express emotions through digital art and creativity."
                            image="https://imgur.com/h1J3VxB.jpg"
                        />
                        <FeatureCard
                            icon={<FaPenNib />}
                            title="Creative Writing"
                            desc="Write and share poetry, stories, and reflections."
                            image="https://imgur.com/Nye41Rm.jpg"
                        />
                        <FeatureCard
                            icon={<FaRobot />}
                            title="AI Chatbot Support"
                            desc="A chatbot that checks on your well-being."
                            image="https://imgur.com/vvS9btE.jpg"
                        />
                        <FeatureCard
                            icon={<FaShieldAlt />}
                            title="Ethical AI & Privacy"
                            desc="Ensuring data security and responsible AI use."
                            image="https://imgur.com/g8zAUSv.jpg"
                        />
                    </section>

                    {/* Testimonials Section */}
                    <section className="p-10 bg-gray-100 dark:bg-gray-900 text-center">
                        <h2 className="text-2xl font-semibold text-[#1E3226] dark:text-blue-200">
                            What Our Users Say
                        </h2>
                        <p className="mt-4 italic text-gray-600 dark:text-gray-400">
                        &quot;Simple and accessible is nice because it&apos;s less
                            overwhelming as a new app for someone to take in.&quot;
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            - Anonymous User
                        </p>
                    </section>

                    {/* Latest Updates */}
                    <section className="p-10">
                        <h2 className="text-2xl font-semibold text-[#1E3226] dark:text-blue-200">
                            Latest from InnerLight
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6 mt-6">
                            <BlogCard
                                title="The Power of Creative Writing"
                                date="March 10, 2025"
                                image="https://imgur.com/g8zAUSv.jpg"
                            />
                            <BlogCard
                                title="Healing Through Art Therapy"
                                date="March 8, 2025"
                                image="https://imgur.com/ouxrWGA.jpg"
                            />
                            <BlogCard
                                title="AI in Mental Health Support"
                                date="March 5, 2025"
                                image="https://imgur.com/vvS9btE.jpg"
                            />
                        </div>
                    </section>
                </div>
            </div>
            <ToastContainer />
            <FloatingEmotionDetection />
        </div>
    );
};
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    image: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
    return (
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg text-center">
            <div className="text-4xl text-yellow-900 dark:text-yellow-300">
                {icon}
            </div>
            <h3 className="mt-3 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {desc}
            </p>
        </div>
    );
}

function BlogCard({
    title,
    date,
    image,
}: {
    title: string;
    date: string;
    image: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-300">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {date}
            </p>
        </div>
    );
}
export default Dashboard;
