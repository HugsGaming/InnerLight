"use client";

import React, { useEffect, useState } from "react";
import LoginForm from "../components/LoginForm";
import SignUpForm from "../components/SignUpForm";
import Header from "../components/Header";

const Auth: React.FC = () => {
    const [showLogin, setShowLogin] = useState(true);
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        const getTheme = () => {
            if (window.localStorage.getItem("dark")) {
                return JSON.parse(
                    window.localStorage.getItem("dark") as string,
                );
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
            className="bg-cover bg-center min-h-screen transition-all duration-500"
            style={{ backgroundImage }}
        >
            {/* Ensure Header component can handle the toggleTheme prop */}
            <Header />
            <div className="flex items-center justify-center min-h-screen">
                {showLogin ? (
                    <LoginForm toggleForm={toggleForm} />
                ) : (
                    <SignUpForm toggleForm={toggleForm} />
                )}
            </div>
        </div>
    );
};

export default Auth;
