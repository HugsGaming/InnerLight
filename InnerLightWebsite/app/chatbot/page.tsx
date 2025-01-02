"use server";

import NewEmotionDetectionChat from "../components/new-emotion-detection/NewEmotionDetectionChat";

export default async function Page() {
    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <NewEmotionDetectionChat />
        </main>
    );
}