// An AI design that passed the review gate (scripts/design.mjs writes these).
import type { DesignSpec } from "../design/spec.ts";

export type ApprovedDesign = {
  spec: DesignSpec;
  subject: string;
  model: string;
  effort: string;
  approvedAt: string;
  runId: string;
  costUsd: number;
  /** Render shown in the gallery, under public/. */
  image?: string;
  notes?: string;
  review: {
    guess: string;
    quality: number;
    fidelity: number;
    recognisable: boolean;
    verdict: string;
    strengths: string[];
    issues: string[];
  };
};
