import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { createClient } from "../../utils/supabase/client";
import { Download, Printer, Lock, AlertTriangle } from "lucide-react";

const EMOTIONS = [
    "angry",
    "disgust",
    "fear",
    "happy",
    "sad",
    "surprise",
    "neutral",
];
const COLORS = [
    "#ef4444",
    "#f97316",
    "#a855f7",
    "#22c55e",
    "#3b82f6",
    "#eab308",
    "#6b7280",
];

interface EmotionData {
    timestamp: string;
    emotion: string;
    confidence: number;
    session_id: string;
}

interface EmotionAnalyticsProps {
    userId: string;
    currentUserId: string;
}

export default function EmotionAnalytics({
    userId,
    currentUserId,
}: EmotionAnalyticsProps) {
    const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Check authorization
        if (userId !== currentUserId) {
            setIsAuthorized(false);
            setIsLoading(false);
            return;
        }
        setIsAuthorized(true);

        const fetchEmotionData = async () => {
            try {
                const { data, error } = await supabase
                    .from("emotion_logs")
                    .select("*")
                    .eq("user_id", userId)
                    .order("timestamp", { ascending: true });

                if (error) throw error;

                // Process data for visualization
                const processedData = data.map((log) => ({
                    ...log,
                    timestamp: new Date(log.timestamp).toLocaleString(),
                    confidence: Math.round(log.confidence * 100),
                }));

                setEmotionData(processedData);
            } catch (err) {
                setError('Unable to process the emotion data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmotionData();
    }, [userId, currentUserId]);

    // Calculate emotion distribution
    const emotionDistribution = EMOTIONS.map((emotion) => ({
        name: emotion,
        value: emotionData.filter((log) => log.emotion === emotion).length,
    }));

    const handleDownload = async () => {
        try {
            // Add audit log
            await supabase.from("data_access_logs").insert([
                {
                    user_id: currentUserId,
                    action: "download",
                    data_type: "emotion_data",
                    timestamp: new Date().toISOString(),
                },
            ]);

            const csvContent = [
                ["Timestamp", "Emotion", "Confidence (%)", "Session ID"],
                ...emotionData.map((log) => [
                    log.timestamp,
                    log.emotion,
                    log.confidence,
                    log.session_id,
                ]),
            ]
                .map((row) => row.join(","))
                .join("\n");

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("hidden", "");
            a.setAttribute("href", url);
            a.setAttribute(
                "download",
                `emotion_data_${new Date().toISOString()}.csv`,
            );
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading data:", error);
        }
    };

    const handlePrint = async () => {
        try {
            // Add audit log
            await supabase.from("data_access_logs").insert([
                {
                    user_id: currentUserId,
                    action: "print",
                    data_type: "emotion_data",
                    timestamp: new Date().toISOString(),
                },
            ]);

            window.print();
        } catch (error) {
            console.error("Error logging print action:", error);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">
                        You are not authorized to view this emotional health
                        data. Only the owner can access this information.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                Loading emotion data...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4">Error: {error}</div>;
    }

    if (!emotionData.length) {
        return <div className="p-4">No emotion data available.</div>;
    }

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex items-center">
                    <Lock className="h-4 w-4 text-blue-400 mr-2" />
                    <p className="text-sm text-blue-700">
                        This emotional health data is protected by HIPAA privacy rules. Do not share or display this information to others.
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Last updated: {new Date(emotionData[emotionData.length - 1].timestamp).toLocaleString()}
                </div>
                <div className="flex space-x-2 print:hidden">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        <Download size={16} />
                        Download Report
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        <Printer size={16} />
                        Print Report
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Emotion Timeline</h2>
                </div>
                <div className="p-4">
                    <div className="h-64 w-full">
                        <ResponsiveContainer>
                            <LineChart data={emotionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="timestamp" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tickFormatter={(value) => new Date(value).toLocaleString()}
                                />
                                <YAxis label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft'}} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                                    labelStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone"
                                    dataKey="confidence"
                                    stroke="#3b82f6"
                                    name="Confidence"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Emotion Distribution</h2>
                </div>
                <div className="p-4">
                    <div className="h-64 w-full">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={emotionDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry) => `${entry.name} (${entry.value})`}
                                    >
                                        {emotionDistribution.map((entry, index) => (
                                            <Cell key={entry.name} fill={COLORS[index]} />
                                        ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="print:block hidden">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Protected Health Information Notice</h2>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-500 mb-4">
                            This document contains protected health information (PHI). This information is covered under HIPAA privacy rules
                            and should be handled with appropriate care and confidentiality.
                        </p>
                        <div className="border-t pt-4">
                            <p className="text-sm">Report generated: {new Date().toLocaleString()}</p>
                            <p className="text-sm">User ID: {userId}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mt-4">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Detailed Emotion Log</h2>
                    </div>
                    <div className="p-4">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left p-2">Timestamp</th>
                                    <th className="text-left p-2">Emotion</th>
                                    <th className="text-left p-2">Confidence</th>
                                    <th className="text-left p-2">Session ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emotionData.map((log, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="p-2">{log.timestamp}</td>
                                        <td className="p-2 capitalize">{log.emotion}</td>
                                        <td className="p-2">{log.confidence}%</td>
                                        <td className="p-2">{log.session_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
