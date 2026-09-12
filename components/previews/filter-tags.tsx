"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterTags } from "@/registry/base/ui/filter-tags";

const items = [
  { value: "romance", label: "浪漫" },
  { value: "dreamy", label: "夢幻氛圍" },
  { value: "mandopop", label: "華語流行音樂" },
  { value: "pop", label: "流行" },
  { value: "relax", label: "放鬆心情" },
  { value: "party", label: "派對" },
  { value: "jpop", label: "日本流行音樂" },
  { value: "rnb", label: "R&B" },
  { value: "indie", label: "獨立音樂" },
  { value: "jazz", label: "爵士" },
  { value: "focus", label: "專注時刻" },
  { value: "night", label: "深夜聆聽" },
];

export default function Preview() {
  const [showScrollbar, setShowScrollbar] = useState(true);
  const [showArrows, setShowArrows] = useState(false);
  const [value, setValue] = useState<string[]>([]);

  return (
    <div className="flex w-full min-w-0 max-w-2xl flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium tracking-tight">今天想聽什麼？</h2>
          <p className="text-sm text-muted-foreground">選幾個喜歡的標籤，新選的會接在已選標籤後面。</p>
        </div>
        <span role="status" className="shrink-0 text-xs tabular-nums text-muted-foreground">
          已選 {value.length} 個
        </span>
      </div>
      <FilterTags
        items={items}
        showScrollbar={showScrollbar}
        showArrows={showArrows ? "auto" : false}
        value={value}
        onValueChange={setValue}
        aria-label="音樂偏好"
        arrows={{ backwardLabel: "向左捲動標籤", forwardLabel: "向右捲動標籤" }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted-foreground">左右滑動瀏覽 · 可多選 · 再點一次取消</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" aria-pressed={showScrollbar} onClick={() => setShowScrollbar(!showScrollbar)}>
            {showScrollbar ? "隱藏捲軸" : "顯示捲軸"}
          </Button>
          <Button variant="ghost" size="xs" aria-pressed={showArrows} onClick={() => setShowArrows(!showArrows)}>
            {showArrows ? "隱藏箭頭" : "顯示箭頭"}
          </Button>
        </div>
      </div>
    </div>
  );
}
