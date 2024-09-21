"use client";
import React, { useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatListComponent from "../components/ChatListComponent";
import ChatComponent from "../components/ChatComponents";

const App: React.FC = () => {
    const [selectedFriend, setSelectedFriend] = useState<any>(null);

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
            <div className="p-10 ml-14 mt-10 md:ml-64 flex flex-row ">
                <div className="w-1/3">
                    <ChatListComponent onSelectFriend={setSelectedFriend} />
                </div>
                <div className="w-2/3">
                    <ChatComponent friend={selectedFriend} />
                </div>
            </div>
        </div>
    );
};

export default App;
