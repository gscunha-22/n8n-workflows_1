import {
  BarChart, Button, Callout, Card, CardBody, CardHeader, Code, Divider, Grid, H1, H3, Link,
  Pill, Row, Stack, Stat, Table, Text, computeDAGLayout, useCanvasState, useHostTheme,
  useEffect, useMemo, useState,
} from "cursor/canvas";

const WF_URL = "https://gavi22.app.n8n.cloud/workflow/3rinE72XzoqIjEvz";
const EXEC_ID = "127";
const DURATION_MS = 39169;
const MODE = "webhook (Gemini 3 Flash)";
const STARTED = "2026-10-17T04:36:00.273Z";

const NODES = [
  "On-Demand Batch Trigger","Is Simulated Test Batch?","Inject Simulated Test Suite",
  "Normalize Email and Label Map","Skip Processed Emails","AI Autonomous Email Classifier",
  "Resolve Decision Contract","Skip Gmail Side Effects if Non-Gmail","Route by Autonomous Intent",
  "Insert GTD Inbox Task","Skip Draft if Simulated","Record Audit and Finance Ledger",
  "Upsert Orders Spreadsheet","Build Executive Digest","Should Send Digest?",
  "Send Executive Digest Email",
] as const;

const EDGES: Array<{ from: string; to: string }> = [
  { from: "On-Demand Batch Trigger", to: "Is Simulated Test Batch?" },
  { from: "Is Simulated Test Batch?", to: "Inject Simulated Test Suite" },
  { from: "Inject Simulated Test Suite", to: "Normalize Email and Label Map" },
  { from: "Normalize Email and Label Map", to: "Skip Processed Emails" },
  { from: "Skip Processed Emails", to: "AI Autonomous Email Classifier" },
  { from: "AI Autonomous Email Classifier", to: "Resolve Decision Contract" },
  { from: "Resolve Decision Contract", to: "Skip Gmail Side Effects if Non-Gmail" },
  { from: "Skip Gmail Side Effects if Non-Gmail", to: "Route by Autonomous Intent" },
  { from: "Route by Autonomous Intent", to: "Insert GTD Inbox Task" },
  { from: "Route by Autonomous Intent", to: "Upsert Orders Spreadsheet" },
  { from: "Route by Autonomous Intent", to: "Record Audit and Finance Ledger" },
  { from: "Insert GTD Inbox Task", to: "Skip Draft if Simulated" },
  { from: "Skip Draft if Simulated", to: "Record Audit and Finance Ledger" },
  { from: "Upsert Orders Spreadsheet", to: "Record Audit and Finance Ledger" },
  { from: "Record Audit and Finance Ledger", to: "Build Executive Digest" },
  { from: "Build Executive Digest", to: "Should Send Digest?" },
  { from: "Should Send Digest?", to: "Send Executive Digest Email" },
];

type Step = {
  name: string; index: number; ms: number; items: number; offset: number; stage: string; note?: string;
};

const STEPS: Step[] = [
  { name: "On-Demand Batch Trigger", index: 0, ms: 1, items: 1, offset: 0, stage: "Trigger", note: "Webhook POST { test_suite: true }" },
  { name: "Is Simulated Test Batch?", index: 1, ms: 10, items: 1, offset: 1, stage: "Ingest", note: "TRUE → harness (pula Gmail fetch)" },
  { name: "Inject Simulated Test Suite", index: 2, ms: 1718, items: 3, offset: 11, stage: "Ingest", note: "3 e-mails: ACTION, ORDER, BILL" },
  { name: "Normalize Email and Label Map", index: 3, ms: 11, items: 3, offset: 1729, stage: "Ingest", note: "is_simulated=true" },
  { name: "Skip Processed Emails", index: 4, ms: 23, items: 3, offset: 1740, stage: "Ingest", note: "Dedup Data Table" },
  { name: "AI Autonomous Email Classifier", index: 5, ms: 33603, items: 3, offset: 1763, stage: "AI", note: "Google Gemini 3 Flash Primary + Fallback Claude Haiku 5.5" },
  { name: "Resolve Decision Contract", index: 12, ms: 1629, items: 3, offset: 17980, stage: "AI", note: "ACTION + ORDER + BILL" },
  { name: "Skip Gmail Side Effects if Non-Gmail", index: 13, ms: 9, items: 3, offset: 19609, stage: "Route", note: "pula labels Gmail (simulado)" },
  { name: "Route by Autonomous Intent", index: 14, ms: 30, items: 3, offset: 19619, stage: "Route", note: "Switch 5 saídas" },
  { name: "Insert GTD Inbox Task", index: 15, ms: 64, items: 1, offset: 19650, stage: "ACTION", note: "GTD Inbox row criada" },
  { name: "Skip Draft if Simulated", index: 16, ms: 7, items: 1, offset: 19715, stage: "ACTION", note: "sem draft Gmail" },
  { name: "Record Audit and Finance Ledger", index: 17, ms: 72, items: 1, offset: 19722, stage: "Ledger", note: "ledger ACTION" },
  { name: "Upsert Orders Spreadsheet", index: 21, ms: 1576, items: 1, offset: 20455, stage: "ORDER", note: "Dell #998877" },
  { name: "Record Audit and Finance Ledger", index: 22, ms: 85, items: 1, offset: 22031, stage: "Ledger", note: "ledger ORDER" },
  { name: "Record Audit and Finance Ledger", index: 26, ms: 66, items: 1, offset: 22544, stage: "Ledger", note: "ledger BILL" },
  { name: "Build Executive Digest", index: 18, ms: 14, items: 1, offset: 19794, stage: "Digest" },
  { name: "Should Send Digest?", index: 19, ms: 8, items: 1, offset: 19809, stage: "Digest" },
  { name: "Send Executive Digest Email", index: 20, ms: 638, items: 1, offset: 19817, stage: "Digest" },
];

const PREVIEWS: Record<string, unknown> = {
  "Inject Simulated Test Suite": [{ id: "sim_action_…", subject: "Confirmacao Anthropic…", simulated: true }],
  "Resolve Decision Contract": [{ intent_route: "ACTION_REQUIRED", store_name: "Anthropic" }],
  "Route by Autonomous Intent": [
    { branch: 0, route: "ACTION_REQUIRED" },
    { branch: 1, route: "ORDER_TRACKING" },
    { branch: 4, route: "BILL_OR_SUBSCRIPTION" },
  ],
  "Insert GTD Inbox Task": [{ text: "[Email: Anthropic] Decidir aprovação…", source: "email-ai-command-center-simulated" }],
  "Upsert Orders Spreadsheet": [{ loja: "Dell", numero_pedido: "998877", item: "Latitude 5440", status: "Em transito" }],
  "Record Audit and Finance Ledger": [{ intent_route: "ACTION_REQUIRED", action_taken: "GTD_TASK_AND_GMAIL_DRAFT" }],
};

const OTHER_EXECS = [
  ["#127 test_suite (Gemini 3 Flash Primary)", "webhook", "success", "39.2 s"],
  ["#116 Digest 08:05/18:05", "trigger", "success", "2.1 s"],
  ["#114 test_suite (Claude Haiku 5.5)", "webhook", "success", "23.2 s"],
  ["#113 test_suite webhook", "webhook", "success", "22.9 s"],
  ["#111 real Gmail batch", "manual", "success", "73.1 s"],
];

function formatMs(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function firstStatus(name: string) {
  const s = STEPS.find((x) => x.name === name);
  return s ? { status: "success" as const, ms: s.ms, index: s.index, note: s.note } : undefined;
}

function ExecutionGraph({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const theme = useHostTheme();
  const layout = useMemo(
    () =>
      computeDAGLayout({
        nodes: NODES.map((id) => ({ id })),
        edges: EDGES,
        direction: "horizontal",
        nodeWidth: 168,
        nodeHeight: 44,
        rankGap: 56,
        nodeGap: 18,
        padding: 16,
      }),
    [],
  );
  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of layout.nodes) m.set(n.id, { x: n.x, y: n.y });
    return m;
  }, [layout]);

  return (
    <div style={{ overflow: "auto", border: `1px solid ${theme.stroke.tertiary}`, background: theme.bg.editor, maxHeight: 340 }}>
      <svg width={layout.width} height={layout.height} style={{ display: "block" }}>
        {layout.edges.map((e, i) => (
          <path
            key={i}
            d={`M ${e.sourceX} ${e.sourceY} C ${(e.sourceX + e.targetX) / 2} ${e.sourceY}, ${(e.sourceX + e.targetX) / 2} ${e.targetY}, ${e.targetX} ${e.targetY}`}
            fill="none"
            stroke={theme.stroke.secondary}
            strokeWidth={1.5}
            opacity={0.85}
          />
        ))}
        {NODES.map((id) => {
          const p = pos.get(id);
          if (!p) return null;
          const st = firstStatus(id);
          const active = selected === id;
          return (
            <g key={id} transform={`translate(${p.x}, ${p.y})`} style={{ cursor: "pointer" }} onClick={() => onSelect(id)}>
              <rect width={168} height={44} rx={4} fill={active ? theme.fill.secondary : theme.fill.tertiary} stroke={active ? theme.accent.primary : theme.stroke.primary} strokeWidth={active ? 2 : 1} />
              <text x={8} y={18} fill={theme.text.primary} fontSize={10} fontFamily="ui-sans-serif, system-ui, sans-serif">
                {id.length > 26 ? id.slice(0, 24) + "…" : id}
              </text>
              <text x={8} y={34} fill={theme.text.tertiary} fontSize={9} fontFamily="ui-sans-serif, system-ui, sans-serif">
                {st ? `success · ${formatMs(st.ms)}` : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function GrokbotExecutionViewer() {
  const theme = useHostTheme();
  const [selected, setSelected] = useCanvasState<string | null>("selectedNode", "Route by Autonomous Intent");
  const [playing, setPlaying] = useState(false);
  const [playIdx, setPlayIdx] = useState(0);
  const steps = STEPS;

  useEffect(() => {
    if (!playing) return;
    if (playIdx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      const next = playIdx + 1;
      setPlayIdx(next);
      setSelected(steps[next]?.name ?? null);
    }, 450);
    return () => clearTimeout(t);
  }, [playing, playIdx, steps, setSelected]);

  const playSelected = playing ? steps[Math.min(playIdx, steps.length - 1)]?.name ?? selected : selected;
  const maxOffset = Math.max(...steps.map((s) => s.offset + s.ms), 1);
  const st = playSelected ? firstStatus(playSelected) : undefined;
  const runs = playSelected ? steps.filter((s) => s.name === playSelected) : [];
  const preview = playSelected ? PREVIEWS[playSelected] : undefined;
  const stageMs = ["Ingest", "AI", "Route", "ACTION", "ORDER", "Ledger", "Digest"].map((stage) => {
    const seen = new Set<string>();
    let sum = 0;
    for (const s of steps) {
      if (s.stage !== stage || seen.has(s.name)) continue;
      seen.add(s.name);
      sum += s.ms;
    }
    return sum;
  });

  return (
    <Stack gap={16} style={{ padding: 16, background: theme.bg.chrome, minHeight: "100%" }}>
      <Stack gap={6}>
        <Row gap={10} align="center" justify="space-between" wrap>
          <Stack gap={4}>
            <H1>Execução ponta a ponta</H1>
            <Text tone="secondary">
              Visão estilo n8n do <Link href={WF_URL}>GROKBOT - Email Command Center</Link>
            </Text>
          </Stack>
          <Pill tone="success" size="md">#{EXEC_ID} · success</Pill>
        </Row>
        <Callout tone="info" title="Como usar no Cursor">
          Clique nos nós do grafo ou na timeline. Use Reproduzir para caminhar o lote passo a passo —
          o mesmo modelo mental do execution view do n8n.
        </Callout>
      </Stack>

      <Grid columns={4} gap={10}>
        <Stat value={`#${EXEC_ID}`} label="Execution ID" />
        <Stat value={formatMs(DURATION_MS)} label="Duração total" />
        <Stat value={`${steps.length}`} label="Steps na timeline" />
        <Stat value={MODE} label="Trigger mode" />
      </Grid>

      <Card>
        <CardHeader trailing={<Pill tone="neutral">{new Date(STARTED).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</Pill>}>
          Grafo da execução #{EXEC_ID} (caminho percorrido)
        </CardHeader>
        <CardBody style={{ padding: 12 }}>
          <ExecutionGraph
            selected={playSelected}
            onSelect={(id) => {
              setPlaying(false);
              setSelected(id);
            }}
          />
          <Row gap={8} align="center" style={{ marginTop: 10 }} wrap>
            <Button
              variant="primary"
              onClick={() => {
                if (playing) {
                  setPlaying(false);
                  return;
                }
                setPlayIdx(0);
                setSelected(steps[0]?.name ?? null);
                setPlaying(true);
              }}
            >
              {playing ? "Pausar" : "Reproduzir execução"}
            </Button>
            <Text tone="tertiary">
              Step {playing ? playIdx + 1 : "—"} / {steps.length}
            </Text>
          </Row>
        </CardBody>
      </Card>

      <Grid columns="1.1fr 0.9fr" gap={12}>
        <Card>
          <CardHeader>Timeline (ordem real)</CardHeader>
          <CardBody style={{ padding: 10, maxHeight: 520, overflow: "auto" }}>
            <Stack gap={6}>
              {steps.map((s) => {
                const active = playSelected === s.name;
                const barW = Math.max(4, Math.round(((s.ms || 1) / maxOffset) * 100));
                return (
                  <div
                    key={`${s.name}-${s.index}`}
                    onClick={() => {
                      setPlaying(false);
                      setSelected(s.name);
                    }}
                    style={{
                      padding: "8px 10px",
                      border: `1px solid ${active ? theme.accent.primary : theme.stroke.tertiary}`,
                      background: active ? theme.fill.secondary : theme.bg.editor,
                      cursor: "pointer",
                    }}
                  >
                    <Row gap={8} align="center" justify="space-between">
                      <Row gap={8} align="center">
                        <Text tone="tertiary" style={{ fontVariantNumeric: "tabular-nums", width: 28 }}>
                          {String(s.index).padStart(2, "0")}
                        </Text>
                        <Pill tone="success" size="sm">success</Pill>
                        <Text weight="medium">{s.name}</Text>
                      </Row>
                      <Text tone="secondary">{formatMs(s.ms)}</Text>
                    </Row>
                    <div style={{ marginTop: 6, height: 4, background: theme.fill.tertiary, position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: `${Math.round((s.offset / maxOffset) * 100)}%`,
                          width: `${barW}%`,
                          height: 4,
                          background: theme.accent.primary,
                        }}
                      />
                    </div>
                    {s.note ? (
                      <Text tone="tertiary" style={{ marginTop: 4, fontSize: 12 }}>
                        {s.note}
                      </Text>
                    ) : null}
                  </div>
                );
              })}
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Detalhe do nó</CardHeader>
          <CardBody>
            {!playSelected ? (
              <Text tone="secondary">Selecione um nó no grafo ou na timeline.</Text>
            ) : (
              <Stack gap={10}>
                <Row gap={8} align="center" wrap>
                  <H3>{playSelected}</H3>
                  <Pill tone="success">success</Pill>
                </Row>
                {st?.note ? <Text tone="secondary">{st.note}</Text> : null}
                <Grid columns={3} gap={8}>
                  <Stat value={st ? formatMs(st.ms) : "—"} label="Duração" />
                  <Stat value={String(runs.length)} label="Runs" />
                  <Stat value={st ? String(st.index) : "—"} label="Ordem" />
                </Grid>
                <Divider />
                <Table
                  headers={["#", "ms", "Itens", "Stage"]}
                  rows={runs.map((r) => [String(r.index), String(r.ms), String(r.items), r.stage])}
                />
                {preview ? (
                  <>
                    <Divider />
                    <Text weight="medium">Amostra de saída</Text>
                    <Code style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>
                      {JSON.stringify(preview, null, 2)}
                    </Code>
                  </>
                ) : null}
              </Stack>
            )}
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardHeader>Outras execuções recentes</CardHeader>
        <CardBody>
          <Table headers={["Exec", "Modo", "Status", "Duração"]} rows={OTHER_EXECS} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Tempo por estágio (ms, 1ª ocorrência)</CardHeader>
        <CardBody>
          <BarChart
            categories={["Ingest", "AI", "Route", "ACTION", "ORDER", "Ledger", "Digest"]}
            series={[{ name: "ms", data: stageMs }]}
            height={200}
          />
          <Text tone="tertiary" style={{ marginTop: 6, fontSize: 11 }}>
            Source: n8n execution #{EXEC_ID} · caminho test_suite
          </Text>
        </CardBody>
      </Card>
    </Stack>
  );
}
