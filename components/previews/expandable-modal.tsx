"use client";

import {
  ExpandableModal,
  type ExpandableModalItem,
} from "@/registry/base/ui/expandable-modal";

// Demo content lives here, not in the registry component: consumers pass their
// own `items` and shouldn't ship these placeholder covers.
function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const svgNamespace = ["http", "://www.w3.org/2000/svg"].join("");

const coverImages = {
  analytics: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="analytics-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#0f172a"/>
          <stop offset="1" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#analytics-bg)"/>
      <rect x="24" y="26" width="72" height="68" rx="12" fill="#ecfeff" opacity=".92"/>
      <path d="M36 76l14-16 13 8 21-27" fill="none" stroke="#0f766e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="36" cy="76" r="5" fill="#14b8a6"/>
      <circle cx="50" cy="60" r="5" fill="#14b8a6"/>
      <circle cx="63" cy="68" r="5" fill="#14b8a6"/>
      <circle cx="84" cy="41" r="5" fill="#14b8a6"/>
    </svg>
  `),
  workflow: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="workflow-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#312e81"/>
          <stop offset="1" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#workflow-bg)"/>
      <rect x="25" y="31" width="32" height="23" rx="8" fill="#e0f2fe"/>
      <rect x="63" y="31" width="32" height="23" rx="8" fill="#bfdbfe"/>
      <rect x="25" y="67" width="32" height="23" rx="8" fill="#a7f3d0"/>
      <rect x="63" y="67" width="32" height="23" rx="8" fill="#fde68a"/>
      <path d="M57 42h6M41 54v13M79 54v13M57 78h6" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `),
  release: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="release-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#164e63"/>
          <stop offset="1" stop-color="#4d7c0f"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#release-bg)"/>
      <path d="M60 22l27 15v31c0 19-11 30-27 36-16-6-27-17-27-36V37z" fill="#ecfccb" opacity=".9"/>
      <path d="M47 62l9 9 19-24" fill="none" stroke="#166534" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M32 92h56" stroke="#d9f99d" stroke-width="6" stroke-linecap="round" opacity=".55"/>
    </svg>
  `),
};

const previewItems: ExpandableModalItem[] = [
  {
    id: "analytics",
    title: "Analytics report",
    description: "Review weekly product signals.",
    content:
      "Compare activation, retention, and conversion changes before sharing the update with the team.",
    image: coverImages.analytics,
  },
  {
    id: "workflow",
    title: "Workflow template",
    description: "Start from a reusable process.",
    content:
      "Duplicate a structured workflow with handoff steps, owners, and review gates already in place.",
    image: coverImages.workflow,
  },
  {
    id: "release",
    title: "Release checklist",
    description: "Confirm launch readiness.",
    content:
      "Open the checklist, verify the final tasks, and keep the launch status aligned across the workspace.",
    image: coverImages.release,
  },
];

export default function Preview() {
  return (
    <div className="flex min-h-112 w-full items-center justify-center">
      <ExpandableModal items={previewItems} className="min-h-112" />
    </div>
  );
}
