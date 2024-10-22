// @ts-check

export default async (phase, { defaultConfig }) => {
    /**
     * @type {import('next').NextConfig});}
     */

    const nextConfig = {
        webpack: (config, options) => {
            config.resolve.fallback = {
                fs: false,
            };

            return config;
        },
    };
    return nextConfig;
};
