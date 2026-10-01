import { useEffect, useRef, useState } from "react";

// The AI designer panel. It talks only to the server route /api/design; the
// API key never reaches the browser. On a static host with no route (the
// public Netlify site) it explains that instead of offering a dead button.

type Health = { enabled: boolean; reason: string | null; model: string; effort: string; busy: boolean };
type Event = { t: number; type: string; [k: string]: unknown };
type Job = {
  id: string;
  subject: string;
  status: "running" | "approved" | "rejected" | "failed";
  events: Event[];
  designId: string | null;
  result: null | {
    status: string;
    reason: string | null;
    cost: { usd: number };
    seconds: number;
    review: null | { quality: number; fidelity: number; guess: string; recognisable: boolean; issues: string[] };
  };
};

const HEADERS = { "Content-Type": "application/json", "X-Designer-Request": "1" };

function describe(e: Event): string {
  switch (e.type) {
    case "start": return `Started with ${e.model} (${e.effort} effort), budget $${e.budgetUsd}`;
    case "compile": return `Compile ${e.n}: ${e.ok ? `valid, ${e.pieces} pieces` : `${e.errors} problems to fix`}`;
    case "submit": return `Submitted, but the compiler found ${e.errors} problems`;
    case "review": return `Review ${e.n}: ${e.pass ? "approved" : "not yet"} (quality ${e.quality}/10, fidelity ${e.fidelity}/10, blind guess "${e.guess}")`;
    case "turn": return `Designer turn ($${e.usd} so far)`;
    case "done": return `Finished: ${e.status}${e.reason ? ` (${e.reason})` : ""}`;
    default: return e.type;
  }
}

export function DesignerPanel() {
  const [health, setHealth] = useState<Health | "off" | null>(null);
  const [subject, setSubject] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState(20);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/design/health")
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : "off"))
      .then(setHealth)
      .catch(() => setHealth("off"));
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, []);

  const poll = (id: string) => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(async () => {
      const r = await fetch(`/api/design/jobs/${id}`);
      if (!r.ok) return;
      const j: Job = await r.json();
      setJob(j);
      if (j.status !== "running" && timer.current) window.clearInterval(timer.current);
    }, 3000);
  };

  const start = async () => {
    setError(null);
    const r = await fetch("/api/design", { method: "POST", headers: HEADERS, body: JSON.stringify({ subject, brief, budgetUsd: budget }) });
    const body = await r.json();
    if (!r.ok) return setError(body.error ?? `request failed (${r.status})`);
    setJob({ id: body.jobId, subject, status: "running", events: [], designId: null, result: null });
    poll(body.jobId);
  };
  const cancel = async () => {
    if (job) await fetch(`/api/design/jobs/${job.id}/cancel`, { method: "POST", headers: HEADERS });
  };

  if (health === null) return null;
  if (health === "off" || !health.enabled) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-4 text-xs text-stone-500 leading-relaxed">
        <p className="font-semibold text-stone-700 mb-1">AI designer: not available on this host</p>
        <p>
          New designs are made by Claude Opus 5.5 working with the architecture compiler and an independent
          reviewer. It runs on a server that holds the API key and headless Chrome
          {health !== "off" && health.reason ? `. Here: ${health.reason}` : "; this site has no such server"}.
          Designs it approves are published here as builds marked AI.
        </p>
      </div>
    );
  }

  const lastRender = job ? [...job.events].reverse().find((e) => e.type === "compile" && e.render) : undefined;
  const running = job?.status === "running";
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 text-xs">
      <p className="font-semibold text-stone-800 mb-1">Design a new model with AI</p>
      <p className="text-stone-500 mb-3 leading-relaxed">
        {health.model} ({health.effort} effort) designs it, the compiler makes every brick from one 21050 set, and a
        reviewer that sees only the renders must recognise it and score it 7/10 or better before it is saved.
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] mb-2">
        <input
          className="border border-stone-300 rounded px-2 py-1.5"
          placeholder="Subject, e.g. Habitat 67, Montreal"
          value={subject}
          disabled={running}
          onChange={(e) => setSubject(e.target.value)}
        />
        <label className="flex items-center gap-1 text-stone-500">
          Budget $
          <input type="number" min={1} max={30} className="w-16 border border-stone-300 rounded px-1 py-1" value={budget}
            disabled={running} onChange={(e) => setBudget(Number(e.target.value))} />
        </label>
      </div>
      <textarea
        className="w-full border border-stone-300 rounded px-2 py-1.5 mb-2"
        rows={2}
        placeholder="Optional brief: what to emphasise"
        value={brief}
        disabled={running}
        onChange={(e) => setBrief(e.target.value)}
      />
      <div className="flex gap-2 mb-3">
        <button className="px-3 py-1.5 rounded bg-stone-900 text-white disabled:opacity-40" disabled={running || subject.trim().length < 3} onClick={start}>
          Start design
        </button>
        {running && <button className="px-3 py-1.5 rounded border border-stone-300" onClick={cancel}>Cancel</button>}
      </div>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {job && (
        <div className="grid gap-3 md:grid-cols-[1fr_320px]">
          <ol className="space-y-1 text-stone-600 max-h-60 overflow-y-auto">
            {job.events.filter((e) => e.type !== "turn").map((e, i) => (
              <li key={i}><span className="font-mono text-stone-400 mr-2">{e.t}s</span>{describe(e)}</li>
            ))}
            {running && <li className="text-stone-400">Working… (a full design takes several minutes)</li>}
            {job.result && (
              <li className="pt-2 font-medium text-stone-800">
                {job.result.status === "approved"
                  ? <>Approved and saved to src/designs/{job.designId}.ts. Print its booklet with generate-manual --spec.</>
                  : `Not saved: ${job.result.reason ?? job.result.status}`}
                <span className="block font-normal text-stone-500">Cost ${job.result.cost.usd}, {job.result.seconds}s</span>
              </li>
            )}
          </ol>
          {lastRender && (
            <img className="w-full border border-stone-200 rounded" alt="Latest render" src={`/api/design/jobs/${job.id}/render/${lastRender.render}`} />
          )}
        </div>
      )}
    </div>
  );
}
