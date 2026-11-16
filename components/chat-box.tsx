"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const mdComponents: Components = {
  p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
  h1: ({ children }) => (
    <h3 style={{ margin: "10px 0 6px", fontSize: 16, fontWeight: 700 }}>{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 style={{ margin: "10px 0 6px", fontSize: 16, fontWeight: 700 }}>{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 style={{ margin: "10px 0 6px", fontSize: 15, fontWeight: 700 }}>{children}</h3>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 8px", paddingLeft: 20, listStyle: "disc" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "0 0 8px", paddingLeft: 20, listStyle: "decimal" }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  code: ({ children }) => (
    <code
      style={{
        background: "#2a2e2b",
        padding: "1px 5px",
        borderRadius: 4,
        fontSize: 13,
      }}
    >
      {children}
    </code>
  ),
};

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Xin chào! Mình có thể giúp gì cho bạn hôm nay?" },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;

    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setText("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMsgs([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs([
        ...next,
        { role: "assistant", content: "Không kết nối được. Thử lại nhé." },
      ]);
    }
    setBusy(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 50 }}>
      {open && (
        <div
          style={{
            width: 340,
            height: 460,
            maxWidth: "calc(100vw - 40px)",
            background: "#111312",
            border: "1px solid #2a2e2b",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            color: "#eee",
            marginBottom: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #2a2e2b",
              fontWeight: 600,
            }}
          >
            Trợ lý Focus OS
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  margin: "8px 0",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "8px 12px",
                    borderRadius: 12,
                    background: m.role === "user" ? "#2f6f4f" : "#1d211f",
                    whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
                    fontSize: 14,
                    lineHeight: 1.5,
                    overflowWrap: "anywhere",
                  }}
                >
                  {m.role === "assistant" ? (
                    <ReactMarkdown components={mdComponents}>{m.content}</ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {busy && <div style={{ opacity: 0.6, fontSize: 14 }}>Đang trả lời…</div>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={send}
            style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid #2a2e2b" }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập câu hỏi..."
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #2a2e2b",
                background: "#1a1d1b",
                color: "#eee",
                outline: "none",
              }}
            />
            <button
              disabled={busy}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: "#2f6f4f",
                color: "#fff",
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid #2a2e2b",
            background: "#111312",
            color: "#eee",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          }}
        >
          {open ? "Đóng" : "Trợ lý"}
        </button>
      </div>
    </div>
  );
}