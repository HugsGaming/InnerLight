// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
    webpack5: true,
    reactStrictMode: false,
    webpack: (config, options) => {
        config.resolve.fallback = {
            fs: false,
        };
        return config; // Don't forget to return the modified config!
    },
    images: {
        domains: ['dyotplmkyxrwdmxymdyp.supabase.co'],
        unoptimized: true
    }
};

module.exports = nextConfig;
