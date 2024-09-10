import "./styles/animations.css"; // Keep this if it's needed
import "./styles/hero.css"; // You can remove this if it's no longer needed
import { redirect } from "next/navigation";
import { createClient } from "./utils/supabase/server";

export default async function Page() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
        redirect("/home");
    }
    return (
        <>
            <div className="relative w-full h-[420px] bg-cover bg-center flex items-center justify-center text-center text-white mb-8 ">
                <div className="max-w-3xl px-4">
                    <h1 className="text-4xl font-bold mb-4">
                        Welcome to InnerLight
                    </h1>
                    <p className="text-xl mb-4">
                        Discover a brighter way to connect with yourself and
                        others.
                    </p>
                    <a
                        href="/auth"
                        className="inline-block text-white bg-yellow-700 hover:bg-yellow-900 py-2 px-6 rounded transition-colors"
                    >
                        Sign Up Now!
                    </a>
                </div>
            </div>
            <div id="marco">
                <div id="cielo"></div>
                <div id="luna"></div>
                <div id="gato"></div>
                <div id="muro"></div>
                <div id="edificios"></div>
            </div>
        </>
    );
}
