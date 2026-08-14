"use client";

import { useState } from "react";

import { AdaptiveSwitch } from "@/registry/base/ui/adaptive-switch";

export default function Preview() {
  const [isLive, setIsLive] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [largeSwitchEnabled, setLargeSwitchEnabled] = useState(false);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Workspace status</span>
        <AdaptiveSwitch
          checked={isLive}
          onCheckedChange={setIsLive}
          checkedLabel="Live"
          uncheckedLabel="Paused"
          aria-label="Workspace status"
        />
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <AdaptiveSwitch
          checked={notificationsEnabled}
          onCheckedChange={setNotificationsEnabled}
        />
        Notifications
      </label>

      <label className="flex items-center gap-3 text-sm font-medium">
        <AdaptiveSwitch
          checked={largeSwitchEnabled}
          onCheckedChange={setLargeSwitchEnabled}
          size="lg"
          animation="none"
        />
        Large switch · no animation
      </label>
    </div>
  );
}
