import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useData } from "@/contexts/DataContext";
import { PageHeader, Panel, SourceNote } from "@/components/Workspace";
import { Button } from "@/components/ui/button";
import { answerQuestion, Answer } from "@/lib/assistant";
import { useHashQuery } from "@/lib/hash-location";
export default function Assistant() {
  const { mode } = useData();
  return <Session key={mode} />;
}
function Session() {
  const { mode, shipments, orders, refresh } = useData();
  const params = useHashQuery();
  const incoming = params.get("q") ?? "";
  const [query, setQuery] = useState(incoming);
  const [messages, setMessages] = useState<
    { question: string; answer: Answer }[]
  >([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef("");
  useEffect(() => {
    setQuery(incoming);
  }, [incoming]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const send = (q = query) => {
    if (!q.trim() || sending) return;
    last.current = q;
    setSending(true);
    setNotice("");
    setQuery("");
    timer.current = setTimeout(() => {
      setMessages(m => [
        ...m,
        { question: q, answer: answerQuestion(q, shipments, orders, mode) },
      ]);
      setSending(false);
      timer.current = null;
    }, 180);
  };
  const unavailable =
    shipments.status === "unavailable" || orders.status === "unavailable";
  return (
    <>
      <PageHeader
        eyebrow="Insights / authorized context"
        title="Assistant"
        description="A deterministic data assistant for shipment and operational order lookups. No model provider is configured; answers do not perform actions."
      />
      <SourceNote />
      {params.get("item") && (
        <p className="muted text-xs">
          Requested context: {params.get("item")}. Review the query and send
          once. Context must be present in your authorized dataset.
        </p>
      )}
      {unavailable && (
        <div className="source-note" role="alert">
          A source is unavailable.{" "}
          <Button size="sm" variant="outline" onClick={refresh}>
            Retry source read
          </Button>
        </div>
      )}
      <Panel
        title="Ask about the selected dataset"
        description="Use a known tracking/order number, ask for a shipment summary, or review exceptions."
      >
        <div
          className="chat-history"
          role="log"
          aria-live="polite"
          aria-label="Assistant conversation"
        >
          {!messages.length && (
            <div className="empty-state">
              <h2>Start with a record or a question</h2>
              <p className="muted">
                Responses cite the selected source, record and observation time
                when supplied. Queries stay in this session.
              </p>
              <div className="suggestion-list">
                {[
                  "Summarize shipments",
                  "Which shipments need attention?",
                  ...(shipments.items[0]
                    ? [`Look up ${shipments.items[0].trackingNumber}`]
                    : []),
                ].map(q => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="space-y-3">
              <div className="chat-message user">
                <p className="eyebrow">You</p>
                <p>{m.question}</p>
              </div>
              <div className="chat-message">
                <p className="eyebrow">
                  {mode === "demo" ? "Demo data assistant" : "Data assistant"}
                </p>
                <p>{m.answer.text}</p>
                {m.answer.links.map(l => (
                  <Link key={l.href} href={l.href}>
                    {l.label} ↗
                  </Link>
                ))}
                <span className="freshness">{m.answer.source}</span>
              </div>
            </div>
          ))}
          {sending && (
            <p role="status" className="muted text-xs">
              Reading selected context…
            </p>
          )}
        </div>
        <form
          className="chat-form mt-6"
          onSubmit={e => {
            e.preventDefault();
            send();
          }}
        >
          <label className="field">
            Your question
            <textarea
              placeholder="Ask about shipments or operational orders…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={2000}
            />
          </label>
          <Button
            type="submit"
            disabled={
              !query.trim() || sending || shipments.status === "loading"
            }
          >
            Send
          </Button>
          {sending && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                timer.current = null;
                setSending(false);
                setNotice("Question cancelled.");
                setQuery(last.current);
              }}
            >
              Cancel
            </Button>
          )}
        </form>
        {notice && (
          <p role="status" className="muted text-xs mt-3">
            {notice}
          </p>
        )}
      </Panel>
    </>
  );
}
