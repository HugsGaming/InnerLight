import React, { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { useReCaptcha } from "next-recaptcha-v3";
import { SlSocialFacebook, SlSocialGoogle } from "react-icons/sl";
import { handleSocialLogin } from "../../utils/socialAuth";

interface FormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function SignUpForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [touchedFields, setTouchedFields] = useState({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        password: false,
        confirmPassword: false,
    });

    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const { executeRecaptcha } = useReCaptcha();

    const getEmailError = (email: string) => {
        if (!email) return "Email is required";
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
            return "Invalid email address";
        }
        return "";
    };

    const getPasswordError = (password: string) => {
        if (!password) return "Password is required";
        if (password.length < 8)
            return "Password must be at least 8 characters";
        if (!/[0-9]/.test(password))
            return "Password must contain at least one number";
        if (!/[A-Z]/.test(password))
            return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(password))
            return "Password must contain at least one lowercase letter";
        return "";
    };

    const getConfirmPasswordError = (
        password: string,
        confirmPassword: string,
    ) => {
        if (!confirmPassword) return "Confirm Password is required";
        if (password !== confirmPassword) return "Passwords must match";
        return "";
    };

    const handleBlur = (field: string) => {
        setTouchedFields({ ...touchedFields, [field]: true });
    };

    const errors = {
        firstName:
            touchedFields.firstName && !formData.firstName
                ? "First name is required"
                : "",
        lastName:
            touchedFields.lastName && !formData.lastName
                ? "Last name is required"
                : "",
        username:
            touchedFields.username && !formData.username
                ? "Username is required"
                : "",
        email: touchedFields.email ? getEmailError(formData.email) : "",
        password: touchedFields.password
            ? getPasswordError(formData.password)
            : "",
        confirmPassword: touchedFields.confirmPassword
            ? getConfirmPasswordError(
                  formData.password,
                  formData.confirmPassword,
              )
            : "",
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched to show any validation errors
        setTouchedFields({
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            password: true,
            confirmPassword: true,
        });

        // Check for any validation errors
        const hasErrors = Object.values(errors).some((error) => error !== "");
        if (hasErrors) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setIsLoading(true);

        try {
            // Execute reCAPTCHA
            // const token = await executeRecaptcha("sign_up");
            // const recaptchaResponse = await fetch("/api/verify-recaptcha", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ token }),
            // });

            // const recaptchaData = await recaptchaResponse.json();
            // if (!recaptchaData.success) {
            //     toast.error("reCAPTCHA verification failed. Please try again.");
            //     return;
            // }

            // Check username uniqueness
            const { data: existingUsername } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", formData.username);

            if (existingUsername && existingUsername.length > 0) {
                toast.error("Username is already taken");
                return;
            }

            const { data: existingEmail } = await supabase
                .from("profiles")
                .select("email")
                .eq("email", formData.email);

            if (existingEmail && existingEmail.length > 0) {
                toast.error("Email is already taken");
                return;
            }

            // Proceed with sign up
            const { data: user, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        username: formData.username,
                    },
                },
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Sign up successful!");
            router.push("/auth/callback");
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                Create Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name Field */}
                <div>
                    <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        First Name
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                            ${errors.firstName ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.firstName}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                            }))
                        }
                        onBlur={() => handleBlur("firstName")}
                    />
                    {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.firstName}
                        </p>
                    )}
                </div>

                {/* Last Name Field */}
                <div>
                    <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Last Name
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                            ${errors.lastName ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.lastName}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                            }))
                        }
                        onBlur={() => handleBlur("lastName")}
                    />
                    {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.lastName}
                        </p>
                    )}
                </div>

                {/* Username Field */}
                <div>
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                            ${errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.username}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                username: e.target.value,
                            }))
                        }
                        onBlur={() => handleBlur("username")}
                    />
                    {errors.username && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.username}
                        </p>
                    )}
                </div>

                {/* Email Field */}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                            ${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
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
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password Field */}
                <div>
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
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                                ${errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10`}
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700
                                dark:hover:text-gray-200 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200"
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
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.password}
                        </p>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                                ${errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10`}
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    confirmPassword: e.target.value,
                                }))
                            }
                            onBlur={() => handleBlur("confirmPassword")}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700
                                dark:hover:text-gray-200 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200"
                            aria-label={
                                showConfirmPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                    text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center mt-6"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Creating account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            or continue with
                        </span>
                    </div>
                </div>

                {/* Social Sign Up Buttons */}
                <div className="space-y-3">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSocialLogin("google")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 
                        hover:bg-red-700 text-white rounded-lg transition-colors duration-300 
                        disabled:bg-red-400"
                    >
                        <SlSocialGoogle className="w-5 h-5" />
                        Sign up with Google
                    </button>

                    {/* <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSocialLogin("facebook")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-800 
                        hover:bg-blue-900 text-white rounded-lg transition-colors duration-300
                        disabled:bg-blue-600"
                    >
                        <SlSocialFacebook className="w-5 h-5" />
                        Sign up with Facebook
                    </button> */}
                </div>

                {/* Login Link */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => router.push("/auth/login")}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 
                        dark:hover:text-blue-300 transition-colors duration-300"
                    >
                        Already have an account? Log in
                    </button>
                </div>
            </form>
        </div>
    );
}
