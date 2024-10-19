import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatComponent from "../components/ChatComponent";
import { createClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";

export const revalidate = 0;

const App: React.FC = async () => {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if(userError || !user || user === null) {
        redirect("/auth/login");
    }
    const { data, error: channelError } = await supabase.from("messageChannels").select("*, user_channels!inner(user_id)").eq("user_channels.user_id", user.id);
    console.log(data, channelError);
    return (
        <div
            className={`min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white`}
        >
            <Head>
                <script
                    src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.8.0/dist/alpine.min.js"
                    defer
                ></script>
            </Head>
            <Header />
            <Sidebar />
            <ChatComponent />
        </div>
    );
};

export default App;
