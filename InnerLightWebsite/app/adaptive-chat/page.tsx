import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import AdaptiveAIInfo from "../components/adaptive-chat/AdaptiveAIInfo";

// Use dynamic import for the adaptive chat component to ensure proper client-side rendering
const AdaptiveChat = dynamic(
    () => import("../components/adaptive-chat/AdaptiveChat"),
    { ssr: false },
);

export default function Page() {
    return (
        <div
            className={`min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-900 text-black dark:text-white`}
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
                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-6">Adaptive AI Assistant</h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">
                        This advanced AI assistant learns from your interactions and adapts to your emotional state.
                        The system uses facial expression analysis to detect your emotions and provides contextually
                        aware responses. Your feedback helps improve future interactions.
                    </p>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-6">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Privacy Notice:</strong> Your emotion data is only used to improve your chat experience.
                            You can provide feedback on AI responses to help personalize future interactions.
                        </p>
                    </div>

                    <AdaptiveAIInfo />
                    
                    <AdaptiveChat />
                </div>
                <ToastContainer />
            </div>
        </div>
    );
}