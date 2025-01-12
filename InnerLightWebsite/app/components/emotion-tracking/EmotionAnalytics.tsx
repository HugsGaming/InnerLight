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
import {
    Download,
    Printer,
    Lock,
    AlertTriangle,
    Info,
    TrendingUp,
} from "lucide-react";

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
    page_path: string | null;
}

interface EmotionTransition {
    source: string;
    target: string;
    value: number;
    percentage: number;
}

interface EmotionMetrics {
    volatilityScore: number;
    stabilityIndex: number;
    dominantEmotion: string;
    emotionalVariance: number;
    emotionTransitions: EmotionTransition[];
    commonSequences: { sequence: string[]; count: number }[];
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
    const [emotionMetrics, setEmotionMetrics] = useState<EmotionMetrics | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
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

        const calculateEmotionMetrics = (data: EmotionData[]) => {
            if (!data.length) return null;

            // Calculate emotion changes
            let emotionChanges = 0;
            for (let i = 1; i < data.length; i++) {
                if (data[i].emotion !== data[i - 1].emotion) {
                    emotionChanges += 1;
                }
            }

            // Calculate dominant emotion
            const emotionCounts = data.reduce(
                (acc, curr) => {
                    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>,
            );
            const dominantEmotion = Object.entries(emotionCounts).sort(
                (a, b) => b[1] - a[1],
            )[0][0];

            // Calculate emotional variance
            const confidences = data.map((log) => log.confidence);
            const averageConfidence =
                confidences.reduce((acc, curr) => acc + curr, 0) /
                confidences.length;
            const variance =
                confidences.reduce(
                    (acc, val) => acc + Math.pow(val - averageConfidence, 2),
                    0,
                ) / confidences.length;

            // Calculate volatility score (0 - 100)
            const volatilityScore = Math.min(
                100,
                (emotionChanges / data.length) * 100,
            );

            // Calculate stability Index (0 - 100)
            const stabilityIndex = Math.max(0, 100 - volatilityScore);

            // Calculate emotion transitions
            const transitions: Record<string, Record<string, number>> = {};
            let totalTransitions = 0;

            EMOTIONS.forEach((emotion) => {
                transitions[emotion] = {};
                EMOTIONS.forEach((otherEmotion) => {
                    transitions[emotion][otherEmotion] = 0;
                });
            });

            for (let i = 1; i < data.length; i++) {
                const sourceEmotion = data[i - 1].emotion;
                const targetEmotion = data[i].emotion;
                if (sourceEmotion !== targetEmotion) {
                    transitions[sourceEmotion][targetEmotion] += 1;
                    totalTransitions += 1;
                }
            }

            const emotionTransitions = [];
            for (const source of EMOTIONS) {
                for (const target of EMOTIONS) {
                    if (transitions[source][target] > 0) {
                        emotionTransitions.push({
                            source,
                            target,
                            value: transitions[source][target],
                            percentage:
                                (transitions[source][target] /
                                    totalTransitions) *
                                100,
                        });
                    }
                }
            }

            // Calculate common emotional sequences (pattern of 3 emotions)
            const sequences: Record<string, number> = {};
            for (let i = 0; i < data.length - 2; i++) {
                const sequence = [
                    data[i].emotion,
                    data[i + 1].emotion,
                    data[i + 2].emotion,
                ].join(" → ");
                sequences[sequence] = (sequences[sequence] || 0) + 1;
            }

            const commonSequences = Object.entries(sequences)
                .map(([sequence, count]) => ({
                    sequence: sequence.split(" → "),
                    count,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            return {
                volatilityScore,
                stabilityIndex,
                dominantEmotion,
                emotionalVariance: variance,
                emotionTransitions,
                commonSequences,
            };
        };

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
                setEmotionMetrics(calculateEmotionMetrics(processedData));
            } catch (err) {
                setError("Unable to process the emotion data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmotionData();
    }, [userId, currentUserId]);

    const getEmotionDescription = (emotion: string, percentage: number) => {
        if (percentage >= 50)
            return `Predominantly ${emotion} emotional state.`;
        if (percentage >= 30) return `Notable presence of ${emotion} emotions.`;
        if (percentage >= 20)
            return `Moderate presence of ${emotion} emotions.`;
        if (percentage > 0) return `Minimal presence of ${emotion}`;
        return `No recorded ${emotion}`;
    };

    // Calculate emotion distribution
    const emotionDistribution = EMOTIONS.map((emotion) => {
        const count = emotionData.filter(
            (log) => log.emotion === emotion,
        ).length;
        const percentage = (count / emotionData.length) * 100;
        return {
            name: emotion,
            value: count,
            percentage,
            description: getEmotionDescription(emotion, percentage),
        };
    });

    function getIntensityLevel(percentage: number) {
        if (percentage >= 50) return "Very High";
        if (percentage >= 30) return "High";
        if (percentage >= 20) return "Moderate";
        if (percentage > 0) return "Low";
        return "None";
    }

    const getTransitionStrength = (percentage: number) => {
        if (percentage >= 30) return "Very Strong";
        if (percentage >= 20) return "Strong";
        if (percentage >= 10) return "Moderate";
        return "Weak";
    };

    const getTransitionDescription = (transition: EmotionTransition) => {
        const strength = getTransitionStrength(transition.percentage);
        return `${strength} transition pattern (${transition.percentage.toFixed(1)}% of all transitions)`;
    };

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

    const getVolatilityDescription = (volatilityScore: number) => {
        if (volatilityScore >= 80) return "Very High Emotion Variability.";
        if (volatilityScore >= 60) return "High Emotion Variability.";
        if (volatilityScore >= 40) return "Moderate Emotion Variability.";
        if (volatilityScore >= 20) return "Low Emotion Variability.";
        return "Very Stable Emotional State.";
    };

    const getStabilityDescription = (stabilityIndex: number) => {
        if (stabilityIndex >= 80) return "Very High Emotional Patterns.";
        if (stabilityIndex >= 60) return "Stable Emotional Patterns.";
        if (stabilityIndex >= 40) return "Moderately Stable Patterns.";
        if (stabilityIndex >= 20) return "Some Emotional Instability.";
        return "Very Unstable Emotional State.";
    };

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            @media print {
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                .print-break-before { page-break-before: always; }
                .print-break-after { page-break-after: always; }
                .print-chart { height: 400px !important; }
                .print-table { font-size: 10pt; }
                .print-container { padding: 0 !important; margin: 0 !important; }
                .print-section { margin-top: 20px !important; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
        <div className="space-y-6 print:space-y-4 print-container">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 no-print">
                <div className="flex items-center">
                    <Lock className="h-4 w-4 text-blue-400 mr-2" />
                    <p className="text-sm text-blue-700">
                        This emotional health data is protected by HIPAA privacy
                        rules. Do not share or display this information to
                        others.
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(
                        emotionData[emotionData.length - 1].timestamp,
                    ).toLocaleString()}
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

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden print-section">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Emotion Timeline
                    </h2>
                </div>
                <div className="p-4">
                    <div className="h-64 print:h-96 print-chart">
                        <ResponsiveContainer>
                            <LineChart data={emotionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timestamp"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tickFormatter={(value) =>
                                        new Date(value).toLocaleString()
                                    }
                                />
                                <YAxis
                                    label={{
                                        value: "Confidence (%)",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.95)",
                                    }}
                                    labelStyle={{ fontWeight: "bold" }}
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
                    <h2 className="text-xl font-semibold text-gray-800">
                        Emotion Distribution
                    </h2>
                </div>
                <div className="p-4 print:p-0">
                    <div className="w-full h-[400px] print:h-[600px]">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={emotionDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={160}
                                    label={(entry) =>
                                        `${entry.name} (${entry.value})`
                                    }
                                    labelLine={true}
                                    className="print:!text-base"
                                >
                                    {emotionDistribution.map((entry, index) => (
                                        <Cell
                                            key={entry.name}
                                            fill={COLORS[index]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.95)",
                                        borderRadius: "4px",
                                        border: "1px solid #e2e8f0",
                                    }}
                                />
                                <Legend height={36} verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Emotional Stability Metrics
                    </h2>
                </div>
                <div className="p-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-500" />
                            <p className="text-sm text-blue-700">
                                These metrics are calculated based on emotional
                                patterns and changes over time. They should be
                                interpreted alongside professional clinical
                                assessment.
                            </p>
                        </div>
                    </div>

                    {emotionMetrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-700">
                                        Emotional Volatility Score
                                    </h3>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {emotionMetrics.volatilityScore.toFixed(
                                            1,
                                        )}
                                        %
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {getVolatilityDescription(
                                        emotionMetrics.volatilityScore,
                                    )}
                                </p>
                            </div>

                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-700">
                                        Emotion Stability Index
                                    </h3>
                                    <span className="text-2xl font-bold text-green-600">
                                        {emotionMetrics.stabilityIndex.toFixed(
                                            1,
                                        )}
                                        %
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {getStabilityDescription(
                                        emotionMetrics.stabilityIndex,
                                    )}
                                </p>
                            </div>

                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-700">
                                        Dominant Emotion
                                    </h3>
                                    <span className="text-lg font-semibold text-purple-600 capitalize">
                                        {emotionMetrics.dominantEmotion}
                                    </span>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-700">
                                        Emotional Variance
                                    </h3>
                                    <span className="text-lg font-semibold text-orange-600">
                                        {emotionMetrics.emotionalVariance.toFixed(
                                            2,
                                        )}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Measures the spread of emotional intensity
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Emotion Transitions Analysis
                    </h2>
                </div>
                <div className="p-4">
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                <p className="text-sm text-blue-700">
                                    This analysis shows how emotions transition
                                    from one to another, helping identify
                                    emotional patterns and common sequences over
                                    time. Understanding these patterns can
                                    provide insights into emotional triggers and
                                    responses.
                                </p>
                            </div>
                        </div>

                        {emotionMetrics?.emotionTransitions && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-700 mb-2">
                                            Most Common Transitions
                                        </h3>
                                        <div className="space-y-2 dark:text-black">
                                            {emotionMetrics.emotionTransitions
                                                .sort(
                                                    (a, b) => b.value - a.value,
                                                )
                                                .slice(0, 5)
                                                .map((transition, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-sm">
                                                            <span className="capitalize">
                                                                {
                                                                    transition.source
                                                                }
                                                            </span>
                                                            {" → "}
                                                            <span className="capitalize">
                                                                {
                                                                    transition.target
                                                                }
                                                            </span>
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {transition.value}{" "}
                                                            times
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-700 mb-2">
                                            Common Emotional Sequences
                                        </h3>
                                        <div className="space-y-2 dark:text-black">
                                            {emotionMetrics.commonSequences.map(
                                                (seq, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-sm capitalize">
                                                            {seq.sequence.join(
                                                                " → ",
                                                            )}
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {seq.count} times
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto mt-4">
                                    <table className="w-full table-fixed dark:text-black">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="w-1/6 p-2 text-left">
                                                    From Emotion
                                                </th>
                                                <th className="w-1/6 p-2 text-left">
                                                    To Emotion
                                                </th>
                                                <th className="w-1/6 p-2 text-left">
                                                    Count
                                                </th>
                                                <th className="w-1/6 p-2 text-left">
                                                    Pattern Strength
                                                </th>
                                                <th className="w-2/6 p-2 text-left">
                                                    Description
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {emotionMetrics.emotionTransitions
                                                .sort(
                                                    (a, b) => b.value - a.value,
                                                )
                                                .map((transition, index) => (
                                                    <tr
                                                        key={index}
                                                        className="border-b"
                                                    >
                                                        <td className="p-2 capitalize">
                                                            {transition.source}
                                                        </td>
                                                        <td className="p-2 capitalize">
                                                            {transition.target}
                                                        </td>
                                                        <td className="p-2">
                                                            {transition.value}
                                                        </td>
                                                        <td className="p-2">
                                                            {getTransitionStrength(
                                                                transition.percentage,
                                                            )}
                                                        </td>
                                                        <td className="p-2 break-words">
                                                            {getTransitionDescription(
                                                                transition,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Emotion Pattern Analysis
                    </h2>
                </div>
                <div className="p-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-700">
                            This is a data pattern analysis only. It is not a
                            medical diagnosis. Please consult healthcare
                            professionals for proper medical evaluation.
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left text-gray-900 dark:text-black">
                                    Emotion
                                </th>
                                <th className="p-2 text-left text-gray-900 dark:text-black">
                                    Count
                                </th>
                                <th className="p-2 text-left text-gray-900 dark:text-black">
                                    Percentage
                                </th>
                                <th className="p-2 text-left text-gray-900 dark:text-black">
                                    Intensity Level
                                </th>
                                <th className="p-2 text-left text-gray-900 dark:text-black">
                                    Pattern Description
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {emotionDistribution
                                .sort((a, b) => b.percentage - a.percentage)
                                .map((emotion) => (
                                    <tr key={emotion.name} className="border-b">
                                        <td className="p-2 capitalize dark:text-black">
                                            {emotion.name}
                                        </td>
                                        <td className="p-2 text-gray-900 dark:text-black">
                                            {emotion.value}
                                        </td>
                                        <td className="p-2 text-gray-900 dark:text-black">
                                            {emotion.percentage.toFixed(1)}%
                                        </td>
                                        <td className="p-2 text-gray-900 dark:black">
                                            {getIntensityLevel(
                                                emotion.percentage,
                                            )}
                                        </td>
                                        <td className="p-2 text-gray-900 dark:text-black">
                                            {emotion.description}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    <p className="font-medium">Intensity Level Guidelines:</p>
                    <ul className="list-disc ml-4 mt-2">
                        <li>Very High: ≥50% of recordings</li>
                        <li>High: 30-49% of recordings</li>
                        <li>Moderate: 20-29% of recordings</li>
                        <li>Low: 1-19% of recordings</li>
                        <li>None: 0% of recordings</li>
                    </ul>
                </div>
            </div>

            <div className="print:block hidden">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Protected Health Information Notice
                        </h2>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-500 mb-4">
                            This document contains protected health information
                            (PHI). This information is covered under HIPAA
                            privacy rules and should be handled with appropriate
                            care and confidentiality.
                        </p>
                        <div className="border-t pt-4">
                            <p className="text-sm">
                                Report generated: {new Date().toLocaleString()}
                            </p>
                            <p className="text-sm">User ID: {userId}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mt-4">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Detailed Emotion Log
                        </h2>
                    </div>
                    <div className="p-4">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left p-2">Timestamp</th>
                                    <th className="text-left p-2">Emotion</th>
                                    <th className="text-left p-2">
                                        Confidence
                                    </th>
                                    <th className="text-left p-2">
                                        Session ID
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {emotionData.map((log, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="p-2">{log.timestamp}</td>
                                        <td className="p-2 capitalize">
                                            {log.emotion}
                                        </td>
                                        <td className="p-2">
                                            {log.confidence}%
                                        </td>
                                        <td className="p-2">
                                            {log.session_id}
                                        </td>
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
