import { Play, RefreshCw, Square, MonitorUp } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type BrowserSession = {
  id: string;
  user_id: string;
  tool_account_id: string | null;
  node_id: string;
  status: string;
  region_code: string;
  timezone: string;
  locale: string;
  target_url: string | null;
  container_id: string | null;
  ttl_seconds: number;
  expires_at: string;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  data: T;
  request_id?: string;
};

const defaultApiBase = import.meta.env.VITE_AGENT_REMOTE_API_BASE ?? "http://127.0.0.1:8765";

function App() {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [token, setToken] = useState(localStorage.getItem("agentRemoteToken") ?? "");
  const [toolAccountId, setToolAccountId] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://claude.ai");
  const [ttlSeconds, setTtlSeconds] = useState(1800);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  useEffect(() => {
    localStorage.setItem("agentRemoteToken", token);
  }, [token]);

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        ...(options.headers ?? {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message ?? `${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    return payload as T;
  }

  async function loadSessions() {
    setBusy(true);
    setError(null);
    try {
      const response = await request<ApiResponse<{ items: BrowserSession[] }>>("/browser-sessions");
      setSessions(response.data.items);
      if (!selectedId && response.data.items.length > 0) {
        setSelectedId(response.data.items[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setBusy(false);
    }
  }

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        tool_account_id: toolAccountId.trim() || null,
        target_url: targetUrl.trim() || null,
        ttl_seconds: ttlSeconds
      };
      const response = await request<ApiResponse<BrowserSession>>("/browser-sessions", {
        method: "POST",
        body: JSON.stringify(body)
      });
      setSessions((items) => [response.data, ...items]);
      setSelectedId(response.data.id);
      setEmbedUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create browser session.");
    } finally {
      setBusy(false);
    }
  }

  async function connectSession() {
    if (!selectedSession) return;
    setBusy(true);
    setError(null);
    try {
      const response = await request<
        ApiResponse<{ browser_session_id: string; status: string; embed_url: string; expires_at: string }>
      >(`/browser-sessions/${selectedSession.id}/connect-info`, { method: "POST" });
      const absoluteUrl = response.data.embed_url.startsWith("http")
        ? response.data.embed_url
        : `${apiBase.replace(/\/$/, "")}${response.data.embed_url}`;
      setEmbedUrl(absoluteUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect browser session.");
    } finally {
      setBusy(false);
    }
  }

  async function stopSession() {
    if (!selectedSession) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/browser-sessions/${selectedSession.id}/stop`, { method: "POST" });
      setEmbedUrl(null);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop browser session.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <MonitorUp size={22} />
          <h1>agent-remote</h1>
        </div>

        <section className="panel">
          <label>
            API
            <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
          </label>
          <label>
            Token
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              type="password"
              autoComplete="off"
            />
          </label>
        </section>

        <form className="panel" onSubmit={createSession}>
          <label>
            Tool account
            <input
              value={toolAccountId}
              onChange={(event) => setToolAccountId(event.target.value)}
              placeholder="UUID"
            />
          </label>
          <label>
            URL
            <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} />
          </label>
          <label>
            TTL
            <input
              value={ttlSeconds}
              onChange={(event) => setTtlSeconds(Number(event.target.value))}
              type="number"
              min={60}
              max={7200}
              step={60}
            />
          </label>
          <button className="primary" type="submit" disabled={busy || !token}>
            <Play size={16} />
            Start
          </button>
        </form>

        <section className="session-list">
          <div className="list-heading">
            <span>Browser sessions</span>
            <button className="icon-button" onClick={loadSessions} disabled={busy || !token} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`session-row ${session.id === selectedId ? "selected" : ""}`}
              onClick={() => {
                setSelectedId(session.id);
                setEmbedUrl(null);
              }}
            >
              <span>{session.target_url ?? "blank"}</span>
              <small>{session.status}</small>
            </button>
          ))}
        </section>
      </aside>

      <section className="workspace">
        <div className="toolbar">
          <div>
            <strong>{selectedSession?.target_url ?? "No browser session selected"}</strong>
            {selectedSession ? (
              <span>
                {selectedSession.region_code} · {selectedSession.timezone} · {selectedSession.locale}
              </span>
            ) : null}
          </div>
          <div className="toolbar-actions">
            <button onClick={connectSession} disabled={busy || selectedSession?.status !== "ready"}>
              <MonitorUp size={16} />
              Connect
            </button>
            <button onClick={stopSession} disabled={busy || !selectedSession}>
              <Square size={16} />
              Stop
            </button>
          </div>
        </div>

        {error ? <div className="error-bar">{error}</div> : null}

        <div className="browser-frame">
          {embedUrl ? (
            <iframe title="Remote browser" src={embedUrl} allow="clipboard-read; clipboard-write" />
          ) : (
            <div className="empty-state">Select a ready browser session and connect.</div>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
