"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function CompletionTest() {
    const questions = [
        { name: "I", label: "I am __________." },
        {
            name: "stress",
            label: "When I feel stressed, I usually __________.",
        },
        {
            name: "happiness",
            label: "The thing that makes me happiest is __________.",
        },
        {
            name: "change",
            label: "If I could change one thing about myself, it would be __________.",
        },
        {
            name: "perception",
            label: "Other people see me as __________, but I see myself as __________.",
        },
        { name: "alone", label: "When I am alone, I feel __________." },
        {
            name: "story1",
            label: "A young boy was walking home from school when he suddenly saw __________. He decided to __________.",
        },
        {
            name: "story2",
            label: "She opened the letter and gasped because __________.",
        },
        {
            name: "logic1",
            label: "If A is greater than B and B is greater than C, then __________.",
        },
        {
            name: "logic2",
            label: "A man starts his journey facing east, turns left, then right, and finally turns left again. He is now facing __________.",
        },
        {
            name: "emotion",
            label: "The world would be a better place if __________.",
        },
    ];

    const [responses, setResponses] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setResponses((prev) => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            toast.success("You have completed the test!");
            setShowAnalysis(true);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    // Refactored renderAnalysis into a proper React component
    const Analysis = () => {
        const [analysis, setAnalysis] = useState<string | null>(null);
        const [isAnalyzing, setIsAnalyzing] = useState(false);

        const analyzeResponses = async () => {
            setIsAnalyzing(true);
            try {
                const response = await fetch("/api/analyze-completion", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ responses }),
                });

                if (!response.ok) {
                    const errorText = await response.text(); // Log raw response text
                    console.error("Error analyzing responses:", errorText);
                    throw new Error("Failed to fetch analysis");
                }

                const data = await response.json();
                setAnalysis(data.analysis);
            } catch (error) {
                console.error("Error analyzing responses:", error);
                setAnalysis("Unable to analyze responses at this time.");
            } finally {
                setIsAnalyzing(false);
            }
        };

        useEffect(() => {
            analyzeResponses();
        }, []);

        return (
            <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">
                    Analysis of Your Answers
                </h2>
                {isAnalyzing ? (
                    <p className="text-sm text-gray-500">
                        Analyzing your responses...
                    </p>
                ) : (
                    <p className="text-sm text-gray-500">{analysis}</p>
                )}
                <ul className="space-y-2 mt-4">
                    {Object.entries(responses).map(([key, value]) => (
                        <li key={key} className="text-sm">
                            <strong>
                                {questions.find((q) => q.name === key)?.label}
                            </strong>
                            : {value}
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm text-gray-500">
                    Note: This analysis is for personal reflection only and does
                    not constitute professional advice.
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-900 text-black dark:text-white">
            <Head>
                <script
                    src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.8.0/dist/alpine.min.js"
                    defer
                ></script>
            </Head>
            <Header />
            <Sidebar />
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <main className="flex-1 p-6 mt-8 flex justify-center items-center">
                    {showAnalysis ? (
                        <Analysis />
                    ) : (
                        <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h1 className="text-lg font-semibold mb-4">
                                Question {currentQuestionIndex + 1} of{" "}
                                {questions.length}
                            </h1>
                            <label className="block text-sm font-medium mb-2">
                                {currentQuestion.label}
                            </label>
                            {currentQuestion.name.startsWith("story") ? (
                                <textarea
                                    name={currentQuestion.name}
                                    value={
                                        responses[currentQuestion.name] || ""
                                    }
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            ) : (
                                <input
                                    type="text"
                                    name={currentQuestion.name}
                                    value={
                                        responses[currentQuestion.name] || ""
                                    }
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            )}
                            <div className="flex justify-between mt-4">
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    {currentQuestionIndex ===
                                    questions.length - 1
                                        ? "Finish"
                                        : "Next"}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
                <div className="p-4 text-center text-sm text-gray-500">
                    <p>
                        <strong>Privacy Notice:</strong> Your responses are
                        stored temporarily for analysis purposes only and will
                        not be shared or saved permanently.
                    </p>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
}
