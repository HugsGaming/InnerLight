import React, { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LogInForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [touchedFields, setTouchedFields] = useState({
        email: false,
        password: false,
    });

    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const getEmailError = (email: string) => {
        if (!email) return "Email is required";
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
            return "Invalid email address";
        }
        return "";
    };

    const handleBlur = (field: string) => {
        setTouchedFields({ ...touchedFields, [field]: true });
    };

    const emailError = touchedFields.email ? getEmailError(formData.email) : "";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsLoading(true);

        try {
            const { data: user, error } =
                await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });

            if (error) {
                toast.error(error.message);
                return;
            }

            if (user) {
                toast.success("Login successful!");
                router.push("/home");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                Log In
            </h2>

            {/* Error Alert */}
            {emailError && touchedFields.email && (
                <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Error
                            </h3>
                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                {emailError}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoFocus
                        aria-describedby="email-description"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                        ${
                            emailError && touchedFields.email
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                        } 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.email}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                            }))
                        }
                        onBlur={() => handleBlur("email")}
                    />
                    <p
                        id="email-description"
                        className="mt-1 text-sm text-gray-500"
                    >
                        We'll never share your email with anyone else.
                    </p>
                </div>

                <div className="relative">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                            border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                            text-gray-900 dark:text-white pr-10"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                }))
                            }
                            onBlur={() => handleBlur("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700
                            focus:outline-none focus:text-gray-700"
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                    text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </button>
                <div>
                    <button
                        className="mt-5 text-blue-500 dark:text-blue-400"
                        onClick={() => {
                            router.push("/auth/signup");
                        }}
                        disabled={isLoading}
                    >
                        Don&apos;t have an account?
                    </button>
                </div>
            </form>
        </div>
    );
}
