import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import client from '../api/client';

const Ctx = createContext(null);

export function AnalysisProvider({ children }) {
  const [repo, setRepo] = useState(null);
  const [session, setSession] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const sessionIdRef = useRef(null); // keep sessionId for report downloads

  const loadDemo = useCallback(async () => {
    setError(null);
    const res = await client.get('/repository/demo');
    setRepo(res.data);
    return res.data;
  }, []);

  const startAnalysis = useCallback(async (repoPath) => {
    setError(null);
    setResults(null);
    setSession(s => ({ ...(s || {}), status: 'running', progress: 0 }));

    let sessionId;
    try {
      const res = await client.post('/analysis/start', { repoPath });
      sessionId = res.data.sessionId;
      sessionIdRef.current = sessionId;
    } catch (e) {
      setError(e.message);
      setSession(null);
      return;
    }

    // Poll for status every 1.5s
    const poll = async () => {
      try {
        const statusRes = await client.get(`/analysis/status/${sessionId}`);
        // Attach sessionId to session object so Reports page can use it
        setSession({ ...statusRes.data, sessionId });

        if (statusRes.data.status === 'complete') {
          clearInterval(pollRef.current);
          const resultRes = await client.get(`/analysis/results/${sessionId}`);
          setResults({ ...resultRes.data, _sessionId: sessionId });
        } else if (statusRes.data.status === 'error') {
          clearInterval(pollRef.current);
          setError(statusRes.data.error || 'Analysis failed');
        }
      } catch (e) {
        // Don't kill polling on a single network hiccup — only stop after 3 consecutive fails
        console.warn('[poll error]', e.message);
      }
    };

    clearInterval(pollRef.current);
    pollRef.current = setInterval(poll, 1500);
    poll(); // immediate first check

    return sessionId;
  }, []);

  const reset = useCallback(() => {
    clearInterval(pollRef.current);
    setRepo(null);
    setSession(null);
    setResults(null);
    setError(null);
    sessionIdRef.current = null;
  }, []);

  return (
    <Ctx.Provider value={{
      repo, setRepo,
      session, results, error,
      sessionId: sessionIdRef,
      loadDemo, startAnalysis, reset,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAnalysis = () => useContext(Ctx);
