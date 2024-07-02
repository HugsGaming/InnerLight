"use client";
import Head from "next/head";
import React, { useRef, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import PostList from "../components/PostList";
import Canvas from "../components/Canvas";

const Home: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentColor, setCurrentColor] = useState("#000000");

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1">
                <Head>
                    <title>Drawing App</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                <Header />

                <main className="flex flex-col items-center min-h-screen p-4">
                    <PostList />
                </main>

                <footer className="w-full h-24 border-t flex justify-center items-center">
                    {/* Footer content */}
                </footer>
            </div>
        </div>
    );
};

export default Home;
