"use client";

import React, { useEffect, useState } from "react";
import LoginForm from "../components/LoginForm";
import SignUpForm from "../components/SignUpForm";
import Header from "../components/Header";
import { FaMoon, FaSun } from "react-icons/fa";
import { Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Auth: React.FC = () => {
    const [showLogin, setShowLogin] = useState(true);
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        const getTheme = () => {
            const storedTheme = window.localStorage.getItem("dark");
            if (storedTheme) {
                return JSON.parse(storedTheme);
            }
            return (
                !!window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            );
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

    const toggleForm = () => {
        setShowLogin(!showLogin);
    };

    const backgroundImage = isDark
        ? "url('https://imgur.com/pbsYPLc.png')"
        : "url('https://imgur.com/cTYX4Ri.png')";

    return (
        <div
            className="bg-cover bg-center transition-all duration-500"
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
                {showLogin ? (
                    <LoginForm toggleForm={toggleForm} />
                ) : (
                    <SignUpForm toggleForm={toggleForm} />
                )}
            </div>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce} 
            />
        </div>
    );
};

export default Auth;
