"use client";

import { ExpandableSubscribe } from "@/registry/base/ui/expandable-subscribe";
import { ReplayablePreview } from "@/components/previews/replayable-preview";

// Demo only: no email is sent or saved. Abort clears the pending demo timer.
function simulateSubscribe(_email: string, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, 1500);
    if (signal.aborted) done();
    else signal.addEventListener("abort", done, { once: true });
  });
}

export default function Preview() {
  return (
    <ReplayablePreview>
      {(key) => <div className="flex w-full items-center justify-center px-6">
        <ExpandableSubscribe key={key} onSubscribe={simulateSubscribe} />
      </div>}
    </ReplayablePreview>
  );
}
