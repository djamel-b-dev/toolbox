import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon, SegmentedControl } from "@toolbox/ui";

type StreamFormat = "openai" | "anthropic" | "raw";

interface HeaderRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface ChatConfig {
  url: string;
  format: StreamFormat;
  model: string;
  systemPrompt: string;
  headers: HeaderRow[];
  extraFields: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface StreamChunk {
  type?: string;
  delta?: { type?: string; text?: string };
  choices?: { delta?: { content?: string }; text?: string }[];
}

const STORAGE_KEY = "workbench:ai-chat-config";

const DEFAULT_CONFIG: ChatConfig = {
  url: "",
  format: "openai",
  model: "gpt-4o-mini",
  systemPrompt: "",
  headers: [
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Authorization", value: "", enabled: true },
  ],
  extraFields: "",
};

function loadConfig(): ChatConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      headers: Array.isArray(parsed.headers) ? parsed.headers : DEFAULT_CONFIG.headers,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function extractDelta(format: StreamFormat, json: StreamChunk): string {
  if (format === "anthropic") {
    return json.type === "content_block_delta" && json.delta?.type === "text_delta" ? (json.delta.text ?? "") : "";
  }
  return json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.text ?? "";
}

async function streamChat(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  format: StreamFormat,
  onDelta: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? " — " + text.slice(0, 300) : ""}`);
  }
  if (!res.body) throw new Error("La réponse ne contient pas de flux exploitable.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    if (format === "raw") {
      onDelta(buffer);
      buffer = "";
      continue;
    }

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as StreamChunk;
        const delta = extractDelta(format, json);
        if (delta) onDelta(delta);
      } catch {
        /* malformed or non-JSON SSE line — skip it and keep streaming */
      }
    }
  }
}

export function AiChatTool() {
  const [config, setConfig] = useState<ChatConfig>(loadConfig);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* localStorage may be unavailable (private mode, quota) — config just won't persist */
    }
  }, [config]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = windowRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function updateHeader(index: number, patch: Partial<HeaderRow>) {
    setConfig((c) => ({ ...c, headers: c.headers.map((h, i) => (i === index ? { ...h, ...patch } : h)) }));
  }
  function addHeader() {
    setConfig((c) => ({ ...c, headers: [...c.headers, { key: "", value: "", enabled: true }] }));
  }
  function removeHeader(index: number) {
    setConfig((c) => ({ ...c, headers: c.headers.filter((_, i) => i !== index) }));
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming || !config.url.trim()) return;
    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const headers: Record<string, string> = {};
      for (const h of config.headers) if (h.enabled && h.key.trim()) headers[h.key.trim()] = h.value;
      if (config.format === "anthropic" && !Object.keys(headers).some((k) => k.toLowerCase() === "anthropic-dangerous-direct-browser-access")) {
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }

      let extra: Record<string, unknown> = {};
      if (config.extraFields.trim()) {
        try {
          extra = JSON.parse(config.extraFields);
        } catch {
          throw new Error("Les champs supplémentaires ne sont pas du JSON valide.");
        }
      }

      const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
      let body: Record<string, unknown>;
      if (config.format === "anthropic") {
        body = { model: config.model, max_tokens: 1024, messages: apiMessages, stream: true, ...extra };
        if (config.systemPrompt.trim()) body.system = config.systemPrompt;
      } else {
        const msgs = config.systemPrompt.trim() ? [{ role: "system", content: config.systemPrompt }, ...apiMessages] : apiMessages;
        body = { model: config.model, messages: msgs, stream: true, ...extra };
      }

      await streamChat(
        config.url,
        headers,
        body,
        config.format,
        (delta) => {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + delta };
            return next;
          });
        },
        controller.signal,
      );
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      if (!isAbort) {
        const isNetworkFailure = e instanceof TypeError;
        const message = isNetworkFailure
          ? "Requête bloquée avant même d'atteindre le serveur (TypeError: Failed to fetch). C'est presque toujours un blocage CORS : " +
            "l'API appelée ne renvoie pas d'en-tête Access-Control-Allow-Origin pour ce site, donc le navigateur refuse la requête " +
            "par sécurité — sans code HTTP ni détail exploitable. La plupart des API de chat (Anthropic, OpenAI…) sont conçues pour " +
            "être appelées depuis un serveur, pas depuis du JavaScript navigateur, justement pour éviter d'exposer une clé API " +
            "côté client. Aucun réglage d'en-tête ici ne peut contourner ça : il faut soit un serveur relais qui ajoute les en-têtes " +
            "CORS, soit une API compatible CORS (ex. un serveur local type Ollama/LM Studio, ou une passerelle que vous contrôlez)."
          : e instanceof Error
            ? e.message
            : "Erreur inconnue.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: message, error: true };
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleClear() {
    setMessages([]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Connexion</span>
        </div>
        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <span className="field-label">URL de l'API</span>
            <input
              className="input"
              value={config.url}
              onChange={(e) => setConfig((c) => ({ ...c, url: e.target.value }))}
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </div>
        </div>
        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field" style={{ maxWidth: 280 }}>
            <span className="field-label">Format de flux</span>
            <SegmentedControl<StreamFormat>
              value={config.format}
              onChange={(format) => setConfig((c) => ({ ...c, format }))}
              options={[
                { value: "openai", label: "OpenAI" },
                { value: "anthropic", label: "Anthropic" },
                { value: "raw", label: "Texte brut" },
              ]}
            />
          </div>
          <div className="field">
            <span className="field-label">Modèle</span>
            <input className="input" value={config.model} onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))} />
          </div>
        </div>
        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <span className="field-label">Prompt système (optionnel)</span>
            <input
              className="input"
              value={config.systemPrompt}
              onChange={(e) => setConfig((c) => ({ ...c, systemPrompt: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">En-têtes HTTP</span>
        </div>
        {config.headers.map((h, i) => (
          <div className="header-row" key={i}>
            <input className="input" value={h.key} onChange={(e) => updateHeader(i, { key: e.target.value })} placeholder="Authorization" />
            <input
              className="input"
              value={h.value}
              onChange={(e) => updateHeader(i, { value: e.target.value })}
              placeholder="Bearer sk-…"
            />
            <button type="button" className="icon-btn" aria-label="Supprimer l'en-tête" onClick={() => removeHeader(i)}>
              <Icon name="trash" />
            </button>
          </div>
        ))}
        <div className="panel-tools">
          <button type="button" className="btn" onClick={addHeader}>
            Ajouter un en-tête
          </button>
        </div>
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Champs supplémentaires (JSON, optionnel)</span>
        </div>
        <textarea
          value={config.extraFields}
          onChange={(e) => setConfig((c) => ({ ...c, extraFields: e.target.value }))}
          placeholder='{"temperature": 0.7}'
          spellCheck={false}
          style={{ minHeight: 60 }}
        />
      </div>

      <p className="row-head hint" style={{ margin: "0 0 0.85rem" }}>
        Envoie une vraie requête réseau à l'URL configurée ci-dessus à chaque message — le seul outil de Workbench à le
        faire. Si l'API ne renvoie pas d'en-têtes CORS pour cette origine, le navigateur bloquera la réponse ; c'est une
        protection du navigateur, pas un bug de l'outil.
        {config.format === "anthropic" && (
          <>
            {" "}En format Anthropic, l'en-tête <code>anthropic-dangerous-direct-browser-access: true</code> est ajouté
            automatiquement pour autoriser l'appel direct depuis le navigateur (comportement officiel de l'API Anthropic) ;
            pensez aussi à ajouter vous-même l'en-tête <code>anthropic-version</code> (ex. <code>2023-06-01</code>), requis
            par l'API.
          </>
        )}
      </p>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Conversation</span>
          {messages.length > 0 && (
            <button type="button" className="btn" onClick={handleClear}>
              Effacer
            </button>
          )}
        </div>
        <div className="chat-window" ref={windowRef}>
          {messages.length === 0 && <p className="chat-empty">Envoyez un message pour commencer.</p>}
          {messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            return (
              <div
                key={i}
                className={"chat-message " + m.role + (m.error ? " error" : "") + (streaming && isLast && m.role === "assistant" ? " streaming" : "")}
              >
                {m.content}
              </div>
            );
          })}
        </div>
        <div className="chat-input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
            spellCheck={false}
          />
          {streaming ? (
            <button type="button" className="btn" onClick={handleStop}>
              Arrêter
            </button>
          ) : (
            <button type="button" className="btn" onClick={handleSend} disabled={!input.trim() || !config.url.trim()}>
              Envoyer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
