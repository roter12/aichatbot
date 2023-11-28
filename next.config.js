/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: [
        {
            source: '/login',
            destination: '/',
        }
    ],
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
