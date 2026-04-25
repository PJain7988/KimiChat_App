
let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://kimichat-app.onrender.com';

// Self-healing for mobile/native environments
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isDev = (hostname === 'localhost' || hostname === '127.0.0.1') && 
                (window.location.port === '5173' || window.location.port === '3000');
                
  if (!isDev && (SERVER_URL.includes('localhost') || SERVER_URL.includes('127.0.0.1') || SERVER_URL.includes('10.95.141.72'))) {
    console.log('🔄 Media Self-healing: Switching to production Render URL');
    SERVER_URL = 'https://kimichat-app.onrender.com';
  }
}

/**
 * Self-healing media URL helper.
 * Detects broken localhost/127.0.0.1 URLs and replaces them with the production SERVER_URL.
 */
export const getMediaUrl = (path) => {
  if (!path) return null;
  
  let cleanPath = path;

  // 1. Detect if the path is an absolute URL pointing to localhost
  if (path.includes('localhost:5000') || path.includes('127.0.0.1:5000')) {
    // Extract the relative part (e.g. uploads/pic.png)
    const parts = path.split('/uploads/');
    if (parts.length > 1) {
      cleanPath = `uploads/${parts[1]}`;
    }
  }

  // 2. Handle already absolute paths (that aren't broken localhost)
  if (cleanPath.startsWith('http')) {
    return cleanPath;
  }

  // 3. Handle base64 / data URLs
  if (cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  // 4. Construct final URL using the correct SERVER_URL
  const relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${SERVER_URL}/${relativePath}`;
};
