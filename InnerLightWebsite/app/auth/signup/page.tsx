"use client";

import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

import { ReCaptchaProvider } from "next-recaptcha-v3";
import SignUpForm from "../../components/new-auth/SignUpForm";

export default function SignUp() {
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        const getTheme = () => {
            const storedTheme = window.localStorage.getItem("dark");
            if (storedTheme) {
                return JSON.parse(storedTheme);
            }
            return !!window.matchMedia("(prefers-color-scheme: dark)").matches;
        };

        const initialTheme = getTheme();
        setIsDark(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme);
    }, []);
    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        window.localStorage.setItem("dark", JSON.stringify(newIsDark));
        document.documentElement.classList.toggle("dark", newIsDark);
    };
    const backgroundImage = isDark
        ? "url('https://imgur.com/pbsYPLc.png')"
        : "url('https://imgur.com/cTYX4Ri.png')";
    return (
        <ReCaptchaProvider reCaptchaKey="6LeW960qAAAAAHaNd2xqC4PGPWNSdD8KztfaAer8">
            <div
                className="min-h-screen bg-cover bg-center bg-no-repeat transition-all duration-500 flex flex-col"
                style={{ backgroundImage }}
            >
                <div className="flex items-center justify-between p-8 border-none">
                    <span>
                        <img
                            src="https://imgur.com/ygBYDbr.png"
                            alt="Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="p-2 transition-colors duration-200 rounded-full shadow-md bg-yellow-700 hover:bg-yellow-900 dark:bg-gray-50 dark:hover:bg-gray-200 text-gray-900 focus:outline-none"
                    >
                        {isDark ? (
                            <FaSun className="w-4 h-4 text-gray-700 dark:text-gray-700" />
                        ) : (
                            <FaMoon className="w-4 h-4 text-gray-100 dark:text-gray-700" />
                        )}
                    </button>
                </div>
                <div className="flex items-center justify-center h-full top-8">
                    <SignUpForm />
                </div>
            </div>
        </ReCaptchaProvider>
    );
}
