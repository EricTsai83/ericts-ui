"use client";

import { useState } from "react";

import { AdaptiveSwitch } from "@/registry/base/ui/adaptive-switch";

export default function Preview() {
  const [largeElasticTextEnabled, setLargeElasticTextEnabled] = useState(true);
  const [mediumStaticTextEnabled, setMediumStaticTextEnabled] = useState(false);
  const [smallSmoothSwitchEnabled, setSmallSmoothSwitchEnabled] =
    useState(false);

  return (
    <div className="grid grid-cols-[max-content_auto] items-center justify-items-start gap-x-4 gap-y-5">
      <span className="text-sm font-medium">Large · With text · Elastic</span>
      <AdaptiveSwitch
        checked={largeElasticTextEnabled}
        onCheckedChange={setLargeElasticTextEnabled}
        checkedLabel="Live"
        uncheckedLabel="Paused"
        size="lg"
        aria-label="Switch with text and elastic animation"
      />

      <span className="text-sm font-medium">
        Medium · With text · No animation
      </span>
      <AdaptiveSwitch
        checked={mediumStaticTextEnabled}
        onCheckedChange={setMediumStaticTextEnabled}
        checkedLabel="On"
        uncheckedLabel="Off"
        size="default"
        animation="none"
        aria-label="Switch with text and without animation"
      />

      <span className="text-sm font-medium">Small · Without text · Smooth</span>
      <AdaptiveSwitch
        checked={smallSmoothSwitchEnabled}
        onCheckedChange={setSmallSmoothSwitchEnabled}
        size="sm"
        aria-label="Switch without text and with smooth animation"
      />
    </div>
  );
}
