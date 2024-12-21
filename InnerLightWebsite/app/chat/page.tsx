import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatApplication from "../components/ChatApplication";
import { createClient } from '../utils/supabase/server';
import { redirect } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { InitialData, Message, EncryptedMessage } from "../components/ChatApplication";
import "react-toastify/dist/ReactToastify.css";
import { EncryptionManager } from "../utils/encryption/client";



async function getInitialData()  {
    const supabase = createClient();

    const encryptionManager = new EncryptionManager();
    await encryptionManager.initialize(process.env.ENCRYPTION_PASSWORD!);
    

    const { data: {user}, error: authError } = await supabase.auth.getUser();
    if(authError || !user) {
        redirect("/auth/login");
    }

    //Get user profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        redirect("/auth/login");
    }

    //Get channels
    const { data: channelsData, error: channelsError } = await supabase
        .from("user_channels")
        .select("messageChannels(id, name, created_at)")
        .eq("user_id", user.id);

    if(channelsError || !channelsData) {
        throw new Error("Error fetching channels");
    }

    const channels = channelsData.map((channel) => channel.messageChannels) ?? [];

    // Get initial messages for first channel if exists
    let initialMessages = [];
    let unreadCounts = {};

    if (channels.length > 0) {
        // Fetch initial messages for the first channel
        const { data: encryptedMessages } = await supabase
            .from("messages")
            .select("*, user:profiles(*)")
            .eq("channel_id", channels[0]!.id)
            .gt('created_at', '1970-01-01')
            .order('created_at', { ascending: false })
            .limit(20);

        initialMessages = (encryptedMessages ?? []).reverse();

        //Fetch lastReadMessages
        const { data: lastReadMessages } = await supabase
            .from('userReadMessages')
            .select('channel_id, message_id, last_read_at')
            .eq('user_id', user.id);

        const lastReadMessagesMap = lastReadMessages?.reduce((acc, message) => {
            if(message.channel_id && message.message_id) {
                acc[message.channel_id] = message.last_read_at;
            }
            return acc
        }, {} as Record<string, string>) ?? {};

        //Get unread counts for each channel
        const unreadCountsPromises = channels.map(async (channel) => {
            const lastReadDate = lastReadMessagesMap[channel?.id!];
            const { count } = await supabase
                .from('messages')
                .select('id', { count: 'exact' })
                .gt(
                    'created_at', lastReadDate ? lastReadDate : '1970-01-01'
                )
                .eq('channel_id', channel?.id!);
                return { channelId: channel?.id!, count: count || 0 };
        });

        const unreadCountsResults = await Promise.all(unreadCountsPromises);
        unreadCounts = unreadCountsResults.reduce((acc, result) => {
            acc[result.channelId] = result.count;
            return acc;
        }, {} as { [channelId: string]: number });

        return {
            currentUser: {
                id: profile.id,
                username: profile.username,
            },
            channels,
            initialMessages: initialMessages as EncryptedMessage[] | [],
            initialChannel: channels[0]?.id || "",
            unreadCounts
        }
    }
}

export default async function ChatPage() {
    const data = await getInitialData();
    if(!data) {
        redirect("/auth/login");
    }
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
            <ChatApplication initialData={data as InitialData} />
            <ToastContainer />
        </div>
    );
};


