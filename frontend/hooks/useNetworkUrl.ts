import { useState, useEffect } from 'react';

/**
 * Hook to get the current network-accessible URL
 * This will work for both localhost and network IPs
 */
export function useNetworkUrl() {
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.host;
      setBaseUrl(`${protocol}//${host}`);
    }
  }, []);

  const getPreviewUrl = (projectId: string): string => {
    // For now, return the base URL - in the future this could be 
    // a specific preview route or subdomain
    return `${baseUrl}/preview/${projectId}`;
  };

  const getCodeServerUrl = (projectId: string): string => {
    // Code-server typically runs on port 8080
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8080`;
  };

  return {
    baseUrl,
    getPreviewUrl,
    getCodeServerUrl,
  };
}
