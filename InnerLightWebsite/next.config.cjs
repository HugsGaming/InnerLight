// @ts-check

module.exports = async (phase, { defaultConfig }) => {
    /**
     * @type {import('next').NextConfig});}
     */

    const nextConfig = {
        webpack5: true,
        reactStrictMode: false,
        webpack: (config, options) => {
            config.resolve.fallback = {
                fs: false,
            };
        },
    };
    return nextConfig;
};
