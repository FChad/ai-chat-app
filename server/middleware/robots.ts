export default defineEventHandler((event) => {
    // Add X-Robots-Tag header to prevent all indexing and crawling
    setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate')

    // Block specific bots with additional headers
    setHeader(event, 'X-Googlebot', 'noindex, nofollow, noarchive, nosnippet')
    setHeader(event, 'X-Bingbot', 'noindex, nofollow, noarchive, nosnippet')
}) 