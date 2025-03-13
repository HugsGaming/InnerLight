import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Head from "next/head";
import Sidebar from "../components/Sidebar";

// Dynamically import the AdaptiveEmotionChat component with SSR disabled
const AdaptiveEmotionChat = dynamic(
    () => import("../components/new-emotion-detection/AdaptiveEmotionChat"),
    { ssr: false },
);

export default function Page() {
    return (
        <div
            className={`min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-900 text-black dark:text-white `}
        >
            <Head>
                <script
                    src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.8.0/dist/alpine.min.js"
                    defer
                ></script>
            </Head>
            <Header />
            <Sidebar />
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                    <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">Adaptive AI Companion</h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        This AI companion learns from your interactions and adapts to your emotional state.
                        Your feedback helps it improve and provide more personalized support.
                    </p>
                </div>
                <AdaptiveEmotionChat />
                <ToastContainer />
            </div>
        </div>
    );
}