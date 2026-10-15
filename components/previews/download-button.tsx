"use client";

import { FolderOpen } from "lucide-react";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import type { DownloadButtonContext } from "@/registry/base/ui/download-button";
import { DownloadButton } from "@/registry/base/ui/download-button";

// Demo only: nothing is fetched. Progress ticks on a timer that abort clears.
function simulateDownload({ signal, setProgress }: DownloadButtonContext) {
  return new Promise<void>((resolve) => {
    let progress = 0;
    const finish = () => {
      clearInterval(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setInterval(() => {
      progress = Math.min(1, progress + 0.04 + Math.random() * 0.08);
      setProgress(progress);
      if (progress >= 1) finish();
    }, 160);
    if (signal.aborted) finish();
    else signal.addEventListener("abort", finish, { once: true });
  });
}

const variants = [
  { caption: "Stays done", props: {} },
  { caption: "Resets after 2s", props: { doneDuration: 2000 } },
  { caption: "No badge", props: { badge: false } },
  {
    caption: "Cancelable, then opens",
    props: {
      cancelable: true,
      doneLabel: "Open file",
      doneIcon: <FolderOpen strokeWidth={2} />,
      onDoneClick: () => {},
    },
  },
];

export default function Preview() {
  return (
    // Replay remounts every button, which also aborts any demo download in flight.
    <ReplayablePreview>
      {(replayKey) => (
        <div className="flex min-h-40 w-full flex-wrap items-center justify-center gap-10 px-6">
          {variants.map(({ caption, props }) => (
            <figure key={caption} className="flex flex-col items-center gap-3">
              <DownloadButton key={replayKey} onDownload={simulateDownload} {...props} />
              <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </ReplayablePreview>
  );
}
