/** @type {import('next').NextConfig} */
const nextConfig = {
    images : {
        domains : ['storage.googleapis.com', 'lh3.googleusercontent.com'],
        // remotePatterns: [
        //     {
        //         protocol: 'https',
        //         hostname: '**',
        //     },
        // ],
    },
};

export default nextConfig;