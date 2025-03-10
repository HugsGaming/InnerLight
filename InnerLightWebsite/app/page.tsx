import { redirect } from "next/navigation";
import { createClient } from "./utils/supabase/server";

export default async function Page() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    if (data.session) {
        redirect("/home");
    }

    return (
        <div
            className="w-full min-h-screen flex flex-col md:flex-row items-center justify-between p-6 
            bg-gradient-to-r from-[#1E3226] via-[#285A43] to-[#3A7D5C]"
        >
            {/* Hero Image on the Left */}
            <div className="flex-1 flex justify-center">
                <img
                    src="https://imgur.com/h1J3VxB.png" // Replace with your image path
                    alt="Hero"
                    className="w-full max-w-[450px] md:max-w-[500px] h-auto object-cover"
                />
            </div>

            {/* Hero Text on the Right */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left px-6">
                <h1 className="text-5xl font-extrabold text-white mb-6">
                    Welcome to InnerLight
                </h1>
                <p className="text-lg text-gray-200 mb-6 max-w-md">
                    Recognizing Mental Health Through Artistic Expression
                </p>
                <a
                    href="/auth/signup"
                    className="inline-block bg-yellow-600 text-white py-3 px-8 rounded-lg hover:bg-yellow-800 transition-all shadow-md font-semibold text-lg"
                >
                    Sign Up Now!
                </a>
            </div>
        </div>
    );
}
