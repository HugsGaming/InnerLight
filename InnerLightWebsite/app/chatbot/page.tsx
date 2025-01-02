import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";

const NewEmotionDetectionChat = dynamic(() => import("../components/new-emotion-detection/NewEmotionDetectionChat"), {
    ssr: false
})

export default async function Page() {
    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <NewEmotionDetectionChat />
            <ToastContainer />
        </main>
    );
}