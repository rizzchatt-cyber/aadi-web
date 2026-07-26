export const getOptimizedImageUrl = (url: string | undefined | null): string => {
    if (!url) return 'https://placehold.co/800x800?text=Product';
    try {
        let cleanUrl = url;
        if (url.includes('wsrv.nl')) {
            const urlObj = new URL(url);
            const nested = urlObj.searchParams.get('url');
            if (nested) {
                cleanUrl = nested;
            }
        }

        const urlObj = new URL(cleanUrl);
        let fileId: string | null = null;

        // Format 1: https://lh3.googleusercontent.com/d/FILE_ID
        if (urlObj.hostname === 'lh3.googleusercontent.com' && urlObj.pathname.startsWith('/d/')) {
            const raw = urlObj.pathname.replace('/d/', '');
            fileId = raw.split('=')[0];
        }

        // Format 2: drive.google.com/thumbnail?id=FILE_ID
        else if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.includes('/thumbnail')) {
            fileId = urlObj.searchParams.get('id');
        }

        // Format 3: drive.usercontent.google.com/download?id=FILE_ID OR drive.google.com/uc?id=FILE_ID
        else if (urlObj.searchParams.has('id')) {
            fileId = urlObj.searchParams.get('id');
        }

        // Format 4: https://drive.google.com/file/d/FILE_ID/view
        else if (urlObj.pathname.includes('/file/d/')) {
            const parts = urlObj.pathname.split('/');
            const dIndex = parts.indexOf('d');
            if (dIndex !== -1 && parts.length > dIndex + 1) {
                fileId = parts[dIndex + 1];
            }
        }

        if (fileId) {
            // Prioritize lh3.googleusercontent.com direct user content CDN as it is the most reliable
            return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
        }
    } catch (e) {
        // Ignore invalid URLs, return as-is
    }
    return url;
};

// Returns an array of fallback URLs to try in order
export const getImageFallbacks = (url: string | undefined | null): string[] => {
    if (!url) return ['https://placehold.co/800x800?text=Product'];
    try {
        let cleanUrl = url;
        if (url.includes('wsrv.nl')) {
            const urlObj = new URL(url);
            const nested = urlObj.searchParams.get('url');
            if (nested) {
                cleanUrl = nested;
            }
        }

        const urlObj = new URL(cleanUrl);
        let fileId: string | null = null;

        if (urlObj.hostname === 'lh3.googleusercontent.com' && urlObj.pathname.startsWith('/d/')) {
            const raw = urlObj.pathname.replace('/d/', '');
            fileId = raw.split('=')[0];
        } else if (urlObj.hostname === 'drive.google.com' && urlObj.pathname.includes('/thumbnail')) {
            fileId = urlObj.searchParams.get('id');
        } else if (urlObj.searchParams.has('id')) {
            fileId = urlObj.searchParams.get('id');
        } else if (urlObj.pathname.includes('/file/d/')) {
            const parts = urlObj.pathname.split('/');
            const dIndex = parts.indexOf('d');
            if (dIndex !== -1 && parts.length > dIndex + 1) {
                fileId = parts[dIndex + 1];
            }
        }

        if (fileId) {
            return [
                `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
                `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
                `https://wsrv.nl/?url=${encodeURIComponent(`https://drive.google.com/uc?id=${fileId}`)}&w=800`,
                `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent('https://drive.google.com/uc?id=' + fileId)}`,
                `https://drive.google.com/uc?export=view&id=${fileId}`,
                'https://placehold.co/800x800?text=Product',
            ];
        }
    } catch (e) { /* ignore */ }
    return [url, 'https://placehold.co/800x800?text=Product'];
};
