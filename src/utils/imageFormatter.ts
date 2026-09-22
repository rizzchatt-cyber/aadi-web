export const getGoogleDriveFileId = (url: string | undefined | null): string | null => {
    if (!url) return null;
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

        return fileId;
    } catch (e) {
        return null;
    }
};

export const getOptimizedImageUrl = (url: string | undefined | null, targetWidth: number = 400): string => {
    if (!url) return 'https://placehold.co/800x800?text=Product';
    const fileId = getGoogleDriveFileId(url);
    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}=w${targetWidth}-rw`;
    }
    return url;
};

// Returns an array of fallback URLs to try in order with target width
export const getImageFallbacks = (url: string | undefined | null, targetWidth: number = 400): string[] => {
    if (!url) return ['https://placehold.co/800x800?text=Product'];
    const fileId = getGoogleDriveFileId(url);
    if (fileId) {
        return [
            `https://lh3.googleusercontent.com/d/${fileId}=w${targetWidth}-rw`,
            `https://lh3.googleusercontent.com/d/${fileId}=w${targetWidth}`,
            `https://drive.google.com/thumbnail?id=${fileId}&sz=w${targetWidth}`,
            `https://drive.google.com/uc?export=view&id=${fileId}`,
            'https://placehold.co/800x800?text=Product',
        ];
    }
    return [url, 'https://placehold.co/800x800?text=Product'];
};


