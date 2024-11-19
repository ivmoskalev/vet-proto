// /app/components/AccessTokenButton.tsx
'use client'; // Required for components in Next.js 13+ for client-side rendering

import { useState } from 'react';

const AccessTokenButton = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setAccessToken(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchAccessToken} disabled={loading}>
        {loading ? 'Fetching Token...' : 'Get Access Token'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {accessToken && (
        <p style={{ wordWrap: 'break-word' }}>
          Access Token: <strong>{accessToken}</strong>
        </p>
      )}
    </div>
  );
};

export default AccessTokenButton;
