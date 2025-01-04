// import type { NextApiRequest, NextApiResponse } from "next";

// type Data = {
//     success: boolean;
//     message?: string;
// };

// export default async function handler(
//     req: NextApiRequest,
//     res: NextApiResponse<Data>,
// ) {
//     if (req.method !== "POST") {
//         res.status(405).json({ success: false, message: "Method Not Allowed" });
//         return;
//     }

//     const { token } = req.body;

//     if (!token) {
//         res.status(400).json({ success: false, message: "Token is required" });
//         return;
//     }

//     try {
//         const secretKey = process.env.RECAPTCHA_SECRET_KEY;
//         const response = await fetch(
//             `https://recaptchaenterprise.googleapis.com/v1/projects/innerlight-1723620024894/assessments?key=${process.env.API_KEY}`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     event: {
//                         token,
//                         // expectedAction: "SIGNUP",
//                         // action: "SIGNUP",
//                         siteKey: process.env.RECAPTCHA_SITE_KEY,
//                     },
//                 }),
//             },
//         );

//         const data = await response.json();

//         if (data && data.tokenProperties && data.tokenProperties.valid) {
//             res.status(200).json({ success: true });
//         } else {
//             res.status(400).json({
//                 success: false,
//                 message: "reCAPTCHA verification failed",
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// }
