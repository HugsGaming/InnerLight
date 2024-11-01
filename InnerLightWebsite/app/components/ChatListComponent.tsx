import React, { useState, useEffect } from "react";
import { ChatList, Input, Button } from "react-chat-elements";
import { createClient } from "../utils/supabase/client";
import "react-chat-elements/dist/main.css";
import { Channel } from "./ChatComponent";
import { Tables } from "../../database.types";

interface ChatListComponentProps {
    onSelectFriend: (friend: any) => void;
}

const ChatListComponent: React.FC<ChatListComponentProps> = ({
    onSelectFriend,
}) => {
    const [channels, setChannels] = useState<any[]>([]);
    const [channelInvite, setChannelInvite] = useState<string>("");
    const [input, setInput] = useState("");
    const supabase = createClient();

    const handleAddFriend = () => {
        if (input.trim()) {
            const newChannel = { title: input, messages: [] };
            setChannels([...channels, newChannel]);
            setInput("");
        }
    };

    const handleSelectFriend = (friend: any) => {
        onSelectFriend(friend);
    };

    useEffect(() => {
        const channel = supabase
            .channel("realtime-channels")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "user_channels",
                },
                (payload) => {
                    console.log(payload.new.channel_id);
                    setChannelInvite(payload.new.channel_id);
                },
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    useEffect(() => {
        supabase.from("messageChannels").select('*').filter('id', 'eq', channelInvite).single().then(({ data, error }) => {
            if (!data || error) {
                throw error;
            }
            setChannels([...channels, data]);
            console.log(data)
        })
    }, [channelInvite, channels, supabase]);

    return (
        <div className="p-4 bg-gray-200 rounded-lg shadow-md h-screen mr-2 dark:bg-gray-800 dark:text-white">
            <div className="flex mb-4 bg-transparent text-black dark:bg-gray-800">
                <Input
                    placeholder="Add a friend..."
                    multiline={false}
                    value={input}
                    onChange={(e: {
                        target: { value: React.SetStateAction<string> };
                    }) => setInput(e.target.value)}
                    maxHeight={100}
                    className="flex-1 mr-2 text-black"
                    rightButtons={
                        <Button text="Add" onClick={handleAddFriend} />
                    }
                />
            </div>
            <ChatList
                className=" bg-transparent text-black "
                dataSource={channels}
                onClick={(friend) => handleSelectFriend(friend)}
                id="chat-list"
                lazyLoadingImage="path/to/lazy-loading-image.png"
            />
        </div>
    );
};

export default ChatListComponent;
