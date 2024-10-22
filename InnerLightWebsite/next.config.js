// @ts-check

export default async () => {
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
