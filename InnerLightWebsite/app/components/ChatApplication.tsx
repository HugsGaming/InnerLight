"use client";

import React, { memo, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { createClient } from '../utils/supabase/client'
import { useRouter } from "next/navigation";
import { produce } from "immer";
import {
    FiPhone,
    FiVideo,
    FiMoreHorizontal,
    FiPaperclip,
    FiSmile,
    FiMic,
} from "react-icons/fi";

// Types
interface Message {
    id: string;
    sender: string;
    text: string;
    time: string;
}

interface Chat {
    name: string;
    messages: Message[];
}

interface ChatState {
    channels: MessageChannel[];
    selectedChannel: string;
    messages: SupabaseMessage[];
    currentUser: {
        id: string;
        username: string
    } | null
}

// type ChatAction =
//     | { type: "SELECT_CHAT"; payload: string }
//     | { type: "SEND_MESSAGE"; payload: { chatName: string; message: Message } };

interface Profile {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string
    email: string;
}

interface MessageChannel {
    id: string;
    name: string | null;
    created_at: string;
}

interface SupabaseMessage {
    id: string;
    text_message: string | null;
    user_id: string | null;
    channel_id: string | null;
    created_at: string;
    type?: string | null;
    title?: string | null;
    data?: JSON | null;
    user?: Profile;
}



// Reducer function for efficient state management
// function chatReducer(state: ChatState, action: ChatAction) {
//     switch (action.type) {
//         case "SELECT_CHAT":
//             return { ...state, selectedChat: action.payload };
//         case "SEND_MESSAGE":
//             return produce(state, (draft) => {
//                 const { chatName, message } = action.payload;
//                 if (!draft.chats[chatName]) {
//                     draft.chats[chatName] = { name: chatName, messages: [] };
//                 }
//                 draft.chats[chatName].messages.push(message);
//             });
//         default:
//             return state;
//     }
// }

// Custom hook for chat management
// function useChatManager(initialChats: Chat[]) {
//     const initialState: ChatState = {
//         chats: initialChats.reduce(
//             (acc, chat) => {
//                 acc[chat.name] = chat;
//                 return acc;
//             },
//             {} as { [key: string]: Chat },
//         ),
//         selectedChat: initialChats[0].name || "",
//     };

//     const [state, dispatch] = useReducer(chatReducer, initialState);

//     const selectChat = useCallback((chatName: string) => {
//         dispatch({ type: "SELECT_CHAT", payload: chatName });
//     }, []);

//     const sendMessage = useCallback((chatName: string, text: string) => {
//         const newMessage: Message = {
//             id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//             sender: "me",
//             text,
//             time: new Date().toLocaleDateString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true,
//             }),
//         };

//         dispatch({
//             type: "SEND_MESSAGE",
//             payload: { chatName, message: newMessage },
//         });
//     }, []);

//     return {
//         state,
//         selectChat,
//         sendMessage,
//     };
// }

// Memoized Sidebar component
const ChatSidebar = memo(
    ({
        chats,
        selectedChat,
        onSelectChat,
    }: {
        chats: MessageChannel[];
        selectedChat: string;
        onSelectChat: (chatName: string) => void;
    }) => {
        const renderChats = useCallback(
            (chatList: MessageChannel[], title: string) => (
                <>
                    <h2 className="text-lg font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    {chatList.map((chat) => (
                        <div
                            key={chat.name}
                            className="flex items-center justify-between p-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow cursor-pointer"
                            onClick={() => onSelectChat(chat.id!)}
                        >
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                    {chat.name}
                                </p>
                                {/* <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {chat.messages[chat.messages.length - 1]
                                        ?.text || ""}
                                </p>
                                <div className="text-right">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {chat.messages[chat.messages.length - 1]
                                            ?.time || ""}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    ))}
                </>
            ),
            [selectedChat, onSelectChat],
        );
        return (
            <div className="bg-white dark:bg-gray-900 w-1/4 border-r dark:border-gray-700 p-4 m-1 rounded-lg">
                {renderChats(chats, "Chats")}
            </div>
        );
    },
);

ChatSidebar.displayName = "ChatSidebar";

// Memoized Chat Window Component
const ChatWindow = memo(
    ({
        chatName,
        messages,
        state,
        onSendMessage,
    }: {
        chatName: string;
        messages: SupabaseMessage[];
        state: ChatState
        onSendMessage: (text: string) => void;
    }) => {
        const [newMessage, setNewMessage] = useState("");

        const handleSendMessage = useCallback(
            (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                if (newMessage.trim() === "") return;
                onSendMessage(newMessage);
                setNewMessage("");
            },
            [newMessage, onSendMessage],
        );


        // const memoizedMessages = useMemo(
        //     () =>
        //         chat.messages.map((msg, idx) => (
        //             <div
        //                 key={msg.id}
        //                 className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} mb-4`}
        //             >
        //                 <div
        //                     className={`rounded-lg p-2 ${msg.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 dark:text-gray-100"}`}
        //                 >
        //                     <p>{msg.text}</p>
        //                     <p className="text-xs text-right">{msg.time}</p>
        //                 </div>
        //             </div>
        //         )),
        //     [chat.messages],
        // );
        const memoizedMessages = useMemo(() => messages.map((msg) => (
            <div
                key={msg.id}
                className={`flex ${msg.user_id === state.currentUser?.id ? 'justify-end' : 'justify-start'} mb-4`}
            >
                <div
                    className={`rounded-lg p-2 ${msg.user_id === state.currentUser?.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-100'}`}
                >
                    <p>{msg.text_message}</p>
                    <p className="text-xs text-right">
                        {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                </div>
            </div>
        )), [messages, state.currentUser ]);
        
        return (
            <div className="flex-1 p-4 flex flex-col justify-between bg-white dark:bg-gray-900 m-1 rounded-lg">
                <div>
                    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {chatName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Online - Last seen, 2:02pm
                            </p>
                        </div>
                        <div className="flex space-x-3 text-gray-900 dark:text-gray-100">
                            <FiPhone />
                            <FiVideo />
                            <FiMoreHorizontal />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar">
                        {memoizedMessages}
                    </div>
                </div>
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                    <FiPaperclip className="mr-3 text-gray-900 dark:text-gray-100" />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 p-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    />
                    <FiSmile className="mr-3 text-gray-900 dark:text-gray-100" />
                    <button type="submit">
                        <FiMic className="text-gray-900 dark:text-gray-100" />
                    </button>
                </form>
            </div>
        );
    },
);

ChatWindow.displayName = "ChatWindow";

export default function ChatApplication() {
    const initialChats: Chat[] = [
        {
            name: "Friends Forever",
            messages: [
                { id: "1", sender: "friend", text: "Hello!", time: "10:00 AM" },
                {
                    id: "2",
                    sender: "me",
                    text: "Hi! How are you?",
                    time: "10:02 AM",
                },
                {
                    id: "3",
                    sender: "friend",
                    text: "I’m good, thanks! What about you?",
                    time: "10:03 AM",
                },
            ],
        },
        {
            name: "Work Group",
            messages: [
                {
                    id: "4",
                    sender: "colleague1",
                    text: "Don’t forget the meeting at 2 PM.",
                    time: "9:30 AM",
                },
                {
                    id: "5",
                    sender: "me",
                    text: "Got it! Thanks for the reminder.",
                    time: "9:35 AM",
                },
                {
                    id: "6",
                    sender: "colleague2",
                    text: "See you all there!",
                    time: "9:40 AM",
                },
            ],
        },
        {
            name: "Family Chat",
            messages: [
                {
                    id: "7",
                    sender: "mom",
                    text: "Dinner is ready!",
                    time: "6:30 PM",
                },
                {
                    id: "8",
                    sender: "me",
                    text: "Coming in 5 minutes.",
                    time: "6:32 PM",
                },
                {
                    id: "9",
                    sender: "dad",
                    text: "Don’t be late!",
                    time: "6:33 PM",
                },
            ],
        },
        {
            name: "Book Club",
            messages: [
                {
                    id: "10",
                    sender: "leader",
                    text: "Reminder: Chapter 5 discussion tomorrow.",
                    time: "8:00 PM",
                },
                {
                    id: "11",
                    sender: "me",
                    text: "Looking forward to it!",
                    time: "8:05 PM",
                },
                {
                    id: "12",
                    sender: "member1",
                    text: "Same here!",
                    time: "8:07 PM",
                },
            ],
        },
    ];

    const [state, setState] = useState<ChatState>({
        channels: [],
        selectedChannel: '',
        messages: [],
        currentUser: null
    });
    const router = useRouter();

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        async function fetchUserAndChannels() {
            const { data: { user }, error} = await supabase.auth.getUser();
            if(error || !user) {
                router.replace('/auth/login');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if(profileError || !profile) {
                router.replace('/auth/login');
                return;
            }

            const { data: channelsData, error: channelsError } = await supabase
                .from('user_channels')
                .select('messageChannels(id, name, created_at)')
                .eq('user_id', user.id);

            const channels = channelsData?.map(channel => channel.messageChannels as MessageChannel) ?? [];
            
            if(channelsError || !channelsData) {
                console.error(channelsError);
                return;
            }

            setState(prev => ({
                ...prev,
                currentUser: {
                    id: profile.id,
                    username: profile.username
                },
                channels,
                selectedChannel: channels[0]?.id || ''
            }))
        }

        fetchUserAndChannels();

        //Real-time message subscription
        const messageSubscription = supabase
            .channel('messages')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    if(payload.new.channel_id === state.selectedChannel) {
                        setState(prev => ({
                            ...prev,
                            messages: [...prev.messages, payload.new as SupabaseMessage] 
                        }))
                    }
                }
            )
            .subscribe();
        
            return () => {
                supabase.removeChannel(messageSubscription);
            };
    }, [state.selectedChannel]);

    // Fetch Messages when Channel Changes
    useEffect(() => {
        if(state.selectedChannel) {
            async function fetchChannelMessages() {
                const { data, error } = await supabase
                    .from('messages')
                    .select(`*,
                        user:profiles(id, username, avatar_url)
                    `)
                    .eq('channel_id', state.selectedChannel)
                    .order('created_at', { ascending: true });

                if(error) {
                    console.error(error);
                    return;
                }

                setState(prev => ({
                    ...prev,
                    messages: data as SupabaseMessage[]
                }))
            }
            fetchChannelMessages();
        }
    }, [state.selectedChannel]);

    const selectChannel = useCallback((channelId: string) => {
        setState(prev => ({
            ...prev,
            selectedChannel: channelId
        }))
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if(!state.currentUser || !state.selectedChannel) return;

        const { error }= await supabase
            .from('messages')
            .insert({
                text_message: text,
                user_id: state.currentUser.id,
                channel_id: state.selectedChannel,
                type: 'text',
                data: null,
                title: null
            })
            .select()
            .single();

        if(error) {
            console.error(error);
        }

    }, [state.currentUser, state.selectedChannel])

    return (
        <div className="flex flex-1 ml-14 mt-14 mb-10 md:ml-64 h-full">
            <ChatSidebar
                chats={state.channels}
                selectedChat={state.selectedChannel}
                onSelectChat={selectChannel}
            />
            <ChatWindow
                chatName={state.selectedChannel}
                messages={state.messages}
                onSendMessage={sendMessage}
                state={state}
            />
        </div>
    );
}
