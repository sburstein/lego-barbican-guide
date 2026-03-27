import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import LegoViewer from "./LegoViewer";
import type { PieceInfo } from "./lego-geometry";
import { ALL_BUILDS } from "./builds";
import {
  FULL_INVENTORY,
  CATEGORIES,
  calculatePieceUsage,
} from "./inventory";

// ─── The single build ────────────────────────────────────────────────
const BUILD = ALL_BUILDS[0];

// ─── App ────────────────────────────────────────────────────────────
export default function App() {
  const build = BUILD;
  const storageKey = `barbican-${build.id}-progress`;

  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activePhase, setActivePhase] = useState(build.phases[0].id);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<PieceInfo | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  // Reset step index when phase changes
  useEffect(() => {
    setActiveStepIndex(0);
  }, [activePhase]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...completed]));
  }, [completed, storageKey]);

  const stepsColumnRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the step list to show the active step card
  useEffect(() => {
    const container = stepsColumnRef.current;
    if (!container) return;
    const activeCard = container.querySelector(`[data-step-index="${activeStepIndex}"]`);
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeStepIndex, activePhase]);

  const toggleStep = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePieceSelect = useCallback((info: PieceInfo | null) => {
    setSelectedPiece(info);
  }, []);

  const totalSteps = build.phases.reduce((a, p) => a + p.steps.length, 0);
  const completedCount = completed.size;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const completedPhaseIds = build.phases
    .filter((p) => p.steps.every((_, i) => completed.has(`${p.id}-${i}`)))
    .map((p) => p.id);

  const activePhaseData = build.phases.find((p) => p.id === activePhase)!;
  const phasePhotos = build.phasePhotos[activePhase] || [];

  // Inventory helpers
  const inventoryUsage = useMemo(() => {
    return calculatePieceUsage([build.id], ALL_BUILDS);
  }, [build.id]);

  const inventoryByCategory = useMemo(() => {
    const groups: Record<string, typeof FULL_INVENTORY> = {};
    for (const cat of CATEGORIES) {
      const items = FULL_INVENTORY.filter((p) => p.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    return groups;
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-stone-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">
                The Barbican Estate — Lakeside Panorama
              </h1>
              <p className="text-[11px] text-stone-400">
                LEGO Architecture Studio 21050 · {build.pieceCount} pieces · {build.phases.length} phases
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              {completedCount}/{totalSteps} steps
            </span>
            <div className="w-28">
              <Progress value={progress} className="h-1.5" />
            </div>
            <span className="text-[11px] font-mono text-stone-400">{progress}%</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Phase tabs */}
        <Tabs value={activePhase} onValueChange={setActivePhase}>
          <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-stone-100 p-1">
            {build.phases.map((phase) => {
              const done = phase.steps.every((_, i) =>
                completed.has(`${phase.id}-${i}`)
              );
              return (
                <TabsTrigger
                  key={phase.id}
                  value={phase.id}
                  className="text-xs data-[state=active]:bg-white flex items-center gap-1.5 px-3"
                >
                  <span>{phase.icon}</span>
                  <span className="hidden sm:inline">{phase.title}</span>
                  {done && (
                    <span className="text-green-600 text-[10px]">✓</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {build.phases.map((phase) => (
            <TabsContent key={phase.id} value={phase.id} className="mt-0">
              {/* 3-column layout: steps | 3D viewer | photos */}
              {/* On xl: fixed-height container so left scrolls, center+right stay sticky */}
              <div className="flex flex-col xl:flex-row lg:flex-row gap-4 xl:h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)]">
                {/* LEFT: Steps — scrollable */}
                <div
                  ref={activePhase === phase.id ? stepsColumnRef : undefined}
                  className="space-y-3 order-2 xl:order-1 lg:order-2 xl:w-[340px] lg:w-[320px] xl:flex-shrink-0 lg:flex-shrink-0 xl:overflow-y-auto lg:overflow-y-auto xl:pr-2 lg:pr-2"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{phase.icon}</span>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight leading-tight">
                        {phase.title}
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        {phase.concept} · {phase.time}
                      </p>
                    </div>
                  </div>

                  {/* Location context */}
                  <div className="bg-stone-100 rounded-lg p-3 border border-stone-200">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                      Where in the Barbican
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {phase.location}
                    </p>
                  </div>

                  {/* Steps */}
                  {phase.steps.map((step, i) => {
                    const stepId = `${phase.id}-${i}`;
                    const done = completed.has(stepId);
                    const isActive3D = i === activeStepIndex;
                    return (
                      <Card
                        key={stepId}
                        data-step-index={i}
                        className={`border transition-colors cursor-pointer ${
                          isActive3D
                            ? "ring-2 ring-red-400/50 border-red-300 bg-red-50/10"
                            : done
                            ? "border-green-200 bg-green-50/30"
                            : step.highlight
                            ? "border-amber-300 bg-amber-50/20"
                            : "border-stone-200 bg-white"
                        }`}
                        onClick={() => setActiveStepIndex(i)}
                      >
                        <CardHeader className="pb-1.5 pt-3 px-3">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={done}
                              onCheckedChange={() => toggleStep(stepId)}
                              className="mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <CardTitle className="text-[13px] font-semibold flex items-center gap-2 leading-tight">
                              <span className={`font-mono text-[11px] ${isActive3D ? "text-red-600 font-bold" : "text-stone-400"}`}>
                                {i + 1}
                              </span>
                              {step.title}
                              {isActive3D && (
                                <Badge className="text-[9px] bg-red-500/10 text-red-600 border border-red-300 px-1.5 py-0">
                                  3D
                                </Badge>
                              )}
                              {step.highlight && (
                                <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 px-1.5 py-0">
                                  Signature
                                </Badge>
                              )}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 pl-8">
                          <p className="text-xs text-stone-600 leading-relaxed mb-2">
                            {step.instruction}
                          </p>

                          {step.pieces.length > 0 && (
                            <div className="bg-stone-50 rounded p-2 mb-2 border border-stone-100">
                              <div className="flex flex-wrap gap-1.5">
                                {step.pieces.map((p) => (
                                  <span
                                    key={p.part}
                                    className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded px-1.5 py-0.5 text-[11px]"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-sm"
                                      style={{
                                        backgroundColor: p.name.includes("Trans")
                                          ? "#bfdbfe"
                                          : "#e7e5e4",
                                        border:
                                          "1px solid " +
                                          (p.name.includes("Trans")
                                            ? "#93c5fd"
                                            : "#d6d3d1"),
                                      }}
                                    />
                                    {p.name}{" "}
                                    <span className="font-mono text-stone-400">
                                      x{p.qty}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div
                            className="flex items-start gap-1.5 rounded p-2 border-l-2"
                            style={{
                              borderColor: phase.color,
                              backgroundColor: phase.color + "08",
                            }}
                          >
                            <span className="text-[10px]">&#128161;</span>
                            <p className="text-[11px] text-stone-500 leading-relaxed italic">
                              {step.tip}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Phase nav */}
                  <div className="flex justify-between pt-2">
                    {build.phases.findIndex((p) => p.id === phase.id) > 0 ? (
                      <button
                        onClick={() => {
                          const idx = build.phases.findIndex(
                            (p) => p.id === phase.id
                          );
                          setActivePhase(build.phases[idx - 1].id);
                        }}
                        className="text-[11px] text-stone-400 hover:text-stone-600"
                      >
                        &larr; Previous
                      </button>
                    ) : (
                      <div />
                    )}
                    {build.phases.findIndex((p) => p.id === phase.id) <
                    build.phases.length - 1 ? (
                      <button
                        onClick={() => {
                          const idx = build.phases.findIndex(
                            (p) => p.id === phase.id
                          );
                          setActivePhase(build.phases[idx + 1].id);
                        }}
                        className="text-[11px] text-stone-600 hover:text-stone-900 font-medium bg-stone-100 px-3 py-1 rounded"
                      >
                        Next &rarr;
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>

                {/* CENTER: 3D Viewer — sticky */}
                <div className="order-1 xl:order-2 lg:order-1 xl:flex-1 lg:flex-1 xl:sticky lg:sticky xl:top-0 lg:top-0 xl:self-start lg:self-start">
                  <Card className="border-stone-200 bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="relative"
                        style={{ height: "min(55vh, 500px)" }}
                      >
                        <LegoViewer
                          buildId={build.id}
                          phaseId={activePhase}
                          stepIndex={activeStepIndex}
                          completedPhases={completedPhaseIds}
                          onPieceSelect={handlePieceSelect}
                        />

                        {/* Step Parts Callout Box — LEGO instruction style */}
                        {activePhaseData.steps[activeStepIndex] &&
                          activePhaseData.steps[activeStepIndex].pieces.length > 0 && (
                          <div className="absolute bottom-12 right-3 bg-[#fdf6e3] border border-[#d4c9a8] rounded-lg shadow-md p-2.5 max-w-[200px]">
                            <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                              Step {activeStepIndex + 1} Parts
                            </p>
                            <div className="space-y-1">
                              {activePhaseData.steps[activeStepIndex].pieces.map((p) => (
                                <div key={p.part} className="flex items-center gap-1.5">
                                  <span
                                    className="w-3 h-3 rounded-sm border flex-shrink-0"
                                    style={{
                                      backgroundColor: p.name.includes("Trans")
                                        ? "#bfdbfe"
                                        : p.name.includes("Green")
                                        ? "#86efac"
                                        : "#e8e5e0",
                                      borderColor: p.name.includes("Trans")
                                        ? "#93c5fd"
                                        : "#d6d3d1",
                                    }}
                                  />
                                  <span className="text-[10px] text-stone-700 leading-tight truncate">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-red-600 ml-auto flex-shrink-0">
                                    x{p.qty}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Controls hint */}
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                          Drag to rotate · Scroll to zoom · Click piece for info
                        </div>

                        {/* Piece info tooltip */}
                        {selectedPiece && (
                          <div className="absolute top-3 left-3 right-3 bg-white border border-stone-200 rounded-lg shadow-lg p-3 max-w-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-stone-900">
                                  {selectedPiece.name}
                                </p>
                                <p className="text-[11px] font-mono text-stone-400">
                                  Part #{selectedPiece.partNumber}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedPiece(null)}
                                className="text-stone-400 hover:text-stone-600 text-xs"
                              >
                                &#10005;
                              </button>
                            </div>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                              {selectedPiece.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Building phase + step label below viewer */}
                  <div className="mt-2 text-center">
                    <p className="text-[11px] text-stone-400">
                      3D model shows:{" "}
                      <span className="font-medium text-stone-600">
                        {activePhaseData.title}
                      </span>
                      {", "}
                      <span className="font-medium text-red-600">
                        Step {activeStepIndex + 1} of {activePhaseData.steps.length}
                      </span>
                      {completedPhaseIds.length > 0 &&
                        ` + ${completedPhaseIds.length} completed phase${
                          completedPhaseIds.length > 1 ? "s" : ""
                        }`}
                    </p>
                  </div>
                </div>

                {/* RIGHT: Reference Photos — sticky */}
                <div className="space-y-3 order-3 xl:w-[300px] xl:flex-shrink-0 xl:overflow-y-auto xl:pr-1">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    Reference Photos
                  </p>

                  {phasePhotos.map((key) => {
                    const photo = build.photos[key];
                    if (!photo) return null;
                    return (
                      <Card
                        key={key}
                        className="border-stone-200 bg-white overflow-hidden"
                      >
                        <div className="relative">
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-40 object-cover"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-2">
                          <p className="text-[11px] text-stone-600 leading-snug">
                            {photo.caption}
                          </p>
                          <p className="text-[9px] text-stone-300 mt-0.5">
                            {photo.credit}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator className="my-6" />

        {/* Piece Inventory — Collapsible Section */}
        <div>
          <button
            onClick={() => setShowInventory(!showInventory)}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight mb-4 hover:text-stone-600 transition-colors"
          >
            <span className={`transition-transform ${showInventory ? "rotate-90" : ""}`}>
              &#9656;
            </span>
            Piece Inventory — Architecture Studio 21050
            <Badge variant="outline" className="text-[9px] font-normal ml-2">
              {FULL_INVENTORY.reduce((a, p) => a + p.totalInSet, 0)} total pieces
            </Badge>
          </button>

          {showInventory && (
            <div className="space-y-6">
              {/* Inventory by Category */}
              <Accordion type="multiple">
                {Object.entries(inventoryByCategory).map(([category, pieces]) => {
                  const catUsed = inventoryUsage.filter(
                    (p) => p.category === category && p.used > 0
                  );
                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="text-xs font-medium hover:no-underline py-2">
                        <span className="flex items-center gap-2">
                          {category}
                          <Badge variant="outline" className="text-[9px] font-normal">
                            {pieces.length} types ·{" "}
                            {pieces.reduce((a, p) => a + p.totalInSet, 0)} pcs
                          </Badge>
                          {catUsed.length > 0 && (
                            <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0">
                              {catUsed.reduce((a, p) => a + p.used, 0)} used
                            </Badge>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {pieces.map((piece) => {
                            const usage = inventoryUsage.find(
                              (u) => u.partNumber === piece.partNumber
                            );
                            const used = usage?.used || 0;
                            const over = used > piece.totalInSet;
                            return (
                              <div
                                key={piece.partNumber}
                                className={`bg-white border rounded p-2 ${
                                  over
                                    ? "border-red-300 bg-red-50/30"
                                    : used > 0
                                    ? "border-blue-200 bg-blue-50/20"
                                    : "border-stone-200"
                                }`}
                              >
                                <p className="text-[10px] text-stone-400 font-mono">
                                  #{piece.partNumber}
                                </p>
                                <p className="text-[11px] font-medium truncate">
                                  {piece.name}
                                </p>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  {used > 0 && (
                                    <span
                                      className={`text-xs font-semibold font-mono ${
                                        over ? "text-red-600" : "text-blue-600"
                                      }`}
                                    >
                                      {used}/
                                    </span>
                                  )}
                                  <span className="text-xs font-mono text-stone-400">
                                    {piece.totalInSet}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Why it matters */}
        <div className="bg-stone-900 text-stone-100 rounded-lg p-6 mb-6">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
            Why the Barbican Matters
          </h4>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            Deeply controversial for decades, the Barbican received Grade II listed status in 2001.
            It was designed as a complete world — every detail from door handles to lake edges by the
            same architects. The barrel-vaulted roofline, once mocked, is now beloved. The
            pick-hammered concrete, once seen as cheap, is recognized as deeply crafted. This build
            captures this: raw geometric forms, massive but elevated on delicate columns, brutal
            concrete softened by water and greenery.
          </p>
        </div>

        <footer className="text-center py-3 text-[10px] text-stone-300 border-t border-stone-100">
          LEGO Architecture Studio 21050 · {build.pieceCount} pieces · {build.phases.length} phases · Photos via Wikimedia Commons (CC)
        </footer>
      </div>
    </div>
  );
}
