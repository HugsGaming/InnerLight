"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleAuthCallback } from "../../utils/socialAuth";
import { Loader2 } from "lucide-react";
import React from "react";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const processAuth = async () => {
            try {
                const { user, error } = await handleAuthCallback();

                if (error) {
                    console.error("Error during social login:", error);
                    router.push("/auth/login");
                    return;
                }

                if (user) {
                    router.push("/home");
                } else {
                    console.error("User not found.");
                    router.push("/auth/login");
                }
            } catch (error) {
                console.error("Error during social login:", error);
                router.push("/auth/login");
            }
        };

        processAuth();
    }, [router]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
                    Completing sign in...
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Please wait while we finish setting up your account.
                </p>
            </div>
        </div>
    );
}
