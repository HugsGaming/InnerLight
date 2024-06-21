"use client";
import Head from "next/head";
import React, { useRef, useState } from "react";
import Canvas from "../components/Canvas";
import "../styles/Canvas.css";
const Home: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentColor, setCurrentColor] = useState("#000000");

    return (
        <div>
            <Head>
                <title>Drawing App</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                <h1>Drawing App</h1>
                <Canvas
                    canvasRef={canvasRef}
                    currentColor={currentColor} // Pass currentColor as a prop
                />
            </main>

            <footer>{/* Footer content */}</footer>

            <style jsx>{`
                main {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 0 20px;
                }
                footer {
                    width: 100%;
                    height: 100px;
                    border-top: 1px solid #eaeaea;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            `}</style>
        </div>
    );
};

export default Home;
