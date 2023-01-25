module.exports = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_API_HOST: process.env.NEXT_PUBLIC_API_HOST,
        NEXT_PUBLIC_SUPPORT_PHONE_NUMBER: process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER,
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT
    },
    images: {
        domains: ['tools.applemediaservices.com', 'play.google.com', 'equater-dev.s3.amazonaws.com']
    },
    async headers() {
        return [
            {
                source: '/.well-known/apple-app-site-association',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/json'
                    }
                ]
            }
        ]
    }
}
