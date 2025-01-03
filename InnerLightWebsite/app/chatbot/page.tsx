import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";

const EnhancedEmotionDetectionChat = dynamic(
    () =>
        import(
            "../components/new-emotion-detection/EnhancedEmotionDetectionChat"
        ),
    { ssr: false },
);

export default function Page() {
    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <EnhancedEmotionDetectionChat />
            <ToastContainer />
        </main>
    );
}
