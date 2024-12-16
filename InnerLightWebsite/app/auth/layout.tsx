import { type ReactNode } from "react";
import { ReCaptchaProvider } from "next-recaptcha-v3";
import "../globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ReCaptchaProvider
                    reCaptchaKey={process.env.RECAPTCHA_SITE_KEY}
                    useEnterprise
                >
                    {children}
                </ReCaptchaProvider>
            </body>
        </html>
    );
}
