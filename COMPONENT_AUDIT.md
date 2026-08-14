# Component Interface Audit

盤點日期：2026-08-14
範圍：`registry/base/` 全部 registry items（31 個 ui、6 個 hooks、3 個 blocks、2 個 css-only 變體，共 42 檔）— **已全數盤點完畢**
評估軸：DX（介面設計）、Robustness（架構穩健性）、Performance（效能最佳實踐）

狀態說明：
- ✅ 通過（無需修改；括號內為已記錄的低優先觀察）
- 🔧 已修改（備註為修改摘要）
- ⚠️ 有發現但未修改（附原因）

## Hooks

| 檔案 | 狀態 | 備註 |
| --- | --- | --- |
| hooks/use-reduced-motion.ts | 🔧 | 改用 `useSyncExternalStore`：首次 client render 即回傳正確偏好，消除 reduced-motion 使用者首幀動畫閃動；SSR snapshot 維持 false |
| hooks/use-element-height.ts | ✅ | callback ref、border-box、threshold 防抖、SSR guard 皆正確 |
| hooks/use-element-size-map.ts | ✅ | cached ref callbacks、WeakMap 反查、immutable 更新皆正確 |
| hooks/use-scroll-anchor.ts | ✅ | live options ref、可中斷 RAF、reduced-motion、cleanup 皆正確 |
| hooks/use-scroll-progress.ts | ✅ | RAF 只在追趕時跑、passive listener、mobile chrome 收合處理 |
| hooks/use-timer.ts | ✅ | timestamp 錨定無飄移、秒界排程、輸入驗證、onComplete 單次 |

## UI Components

| 檔案 | 狀態 | 備註 |
| --- | --- | --- |
| ui/adaptive-drawer.tsx | 🔧 | `trigger` 傳 element 時改走 `asChild`（避免巢狀 `<button>`）、傳 `null` 可完全不渲染 trigger（純受控用法）；新增 `className` 對齊慣例 |
| ui/check-animation.tsx | ✅ | server-component 相容、a11y 切換正確、reduced-motion 有效 |
| ui/context-cursor.tsx | 🔧 | 修 bug：target 在 hover 中被 unmount 時 badge 會帶舊 label 永久跟隨游標；已加 unmount cleanup |
| ui/copy-button.tsx | ✅ | （與 css-only 變體的 data attribute 命名不同：`data-copied` vs `data-state`，各自內部一致，未強行統一） |
| ui/expandable-modal.tsx | 🔧 | focus trap effect 改 key 在 `activeItem.id`、`closeActiveItem` 走 ref（controlled + inline callback 不再每次 render 搶 focus）；`modalLabel` 從無效 prop 修成可用（明示時取代 `aria-labelledby`）；overlay 的 dead `onClick` 移除、標記 `pointer-events-none`。（`items` 內建 demo 資料、`value` 為物件非 id：已記錄為 API 改版建議） |
| ui/expandable-tabs.tsx | 🔧 | Props 改繼承 div props：root 支援 rest props / `style` / `onKeyDown` 鏈接；Escape 處理尊重 `defaultPrevented` |
| ui/expandable-toolbar.tsx | 🔧 | `useMeasuredWidth` 改 callback ref：晚掛載的面板（`side` 切換、children 增加）現在量得到寬度，不再打開成 0 寬。（`role="toolbar"` 未含 roving tabindex：已記錄） |
| ui/expanding-panel.tsx | 🔧 | outside-click 加 `isConnected` 防護；JSDoc 明示 portal 內容需 `closeOnOutsideClick={false}`。（`classNames` 物件慣例與他處不同：已記錄） |
| ui/expanding-segmented-tabs.tsx | ⚠️ | controlled `value` 指向 disabled/未知項時被靜默 remap 到第一個 enabled 項——與 roving tabindex 實作耦合，改動風險大於效益，保留並記錄 |
| ui/expanding-slider.tsx | ✅ | （RTL 未支援、Track 缺 Rail 時指標靜默無效：已記錄為文件化建議） |
| ui/expanding-toggle-button.tsx | 🔧 | 開放 `style` prop（`width` 仍由元件管理，其餘透傳） |
| ui/feedback-popover.tsx | 🔧 | Escape / 成功送出關閉後 focus 回 trigger（pointer 關閉不搶 focus）；controlled 開啟也會重置表單（不再重現上次的 success 畫面/草稿）；Cmd/Ctrl+Enter 限定 focus 在 popover 內才送出。（`placeholder` 因浮動 label 設計實際不可見：已記錄） |
| ui/floating-select.tsx | 🔧 | 開啟時 focus 移入選中選項、鍵盤關閉/選取後 focus 回 trigger（修復 focus 掉到 body）；listbox 補上 ArrowUp/Down/Home/End roving focus；移除永遠懸空的 `aria-controls`。（controlled `open` triad、root rest-prop spread：已記錄為 API 增補建議） |
| ui/floating-shortcut-button.tsx | 🔧 | 補上 outside-click 關閉（ARIA menu button pattern；不搶 focus） |
| ui/heartbeat-animation.tsx | 🔧 | 修正顛倒的 JSDoc（`showShadow`）。（children 會渲染兩次〔陰影層〕，含 id 的 children 會重複：已記錄） |
| ui/highlight-tabs.tsx | 🔧 | `onValueChange` 補第二參數 `(value, tab)` 對齊 RailList/SlidingList；`HighlightTab` 增 `id`/`ariaControls` 完成 tabs a11y 契約；controlled 未知 value 時保留可聚焦 tab（修鍵盤不可達）；補 `aria-orientation`；`selectOnHover` 預設 true 為招牌互動，保留但 JSDoc 明確警告 hover 會 commit |
| ui/jitter-animation.tsx | 🔧 | 修 bug：CSS 變數只定義在 `.jitter-animation`，獨立 `<Jitter>`（`.jitter`）的 horizontal/vertical 完全沒有動畫；一次性動畫移除永久 `will-change` |
| ui/multi-step.tsx | 🔧 | direction 改為 render 期從 step delta 推導：外部驅動 `currentStep`（含自訂 footer 的唯一路徑）回退時不再往前滑；新增 `onComplete`（最後一步的 Done 可點）；`footer={null}` 現在真的能隱藏 footer |
| ui/navigation-menu.tsx | 🔧 | 新增 `positioner` opt-out prop（自組 positioner 不再出現兩個 portal）；export `NavigationMenuProps` |
| ui/otp-input.tsx | 🔧 | 修 Android 軟鍵盤（keydown 為 "Unidentified"，單字元 change 事件原本會整組蓋掉，現在走 `insert` 正常打字）；controlled `value` 外部變更（如驗證失敗清空）會同步內部 slots/游標，方向鍵不再卡死；新增 `onValueChange`（`onChange` 保留為 deprecated alias） |
| ui/play-button.tsx | ✅ | 整體最佳：SSR-safe path morph、可中斷動畫、ref 轉發、慣例完整 |
| ui/projected-shadow-animation.tsx | 🔧 | 修正顛倒的 JSDoc；CSS 補 `:focus-within` 讓鍵盤使用者有 hover 對等效果。（`data-active="true"` 與他處 `""` 不同、常駐 `will-change`：已記錄，避免破壞既有 selector 未改） |
| ui/rail-list.tsx | ✅ | 雙軸方向鍵為專案既定設計（vertical-scene 測試背書），維持 |
| ui/sliding-list.tsx | ✅ | 同上。（indicator 動畫用 transform 字串走主執行緒插值：已記錄為 perf 建議） |
| ui/smooth-height.tsx | ✅ | 量測、observer cleanup、reduced-motion 皆正確 |
| ui/squeeze-animation.tsx | ✅ | 介面為 CSS-only 組最佳。（一次性動畫的常駐 `will-change`：低優先，已記錄） |
| ui/staggered-entrance.tsx | ✅ | （`opacity`/`scale` 實為起始值，命名易誤讀：已記錄為 `fromOpacity`/`fromScale` 改名建議） |
| ui/status-badge.tsx | ✅ | （`role="status"`/`aria-live` 可由 props 透傳，未內建：已記錄） |
| ui/status-button.tsx | 🔧 | `loadingDuration` 語意從「完成後再加 1.75s」改為「最短顯示時間」（3s 的 API 不再變 4.75s）；aria-live 播報改跟隨 label props（不再永遠唸 "Sending login link"）；新增 `loadingAnnouncement`/`successAnnouncement`。（onClick 例外靜默重置、demo 預設文案：已記錄） |
| ui/text-morph.tsx | 🔧 | 以 code point 切分（emoji 不再裂成亂碼）；改用 sr-only 文字取代 generic span 的 `aria-label`（螢幕閱讀器可靠）；新增 `transition` prop |
| ui/timer.tsx | 🔧 | `paused` prop 只在 true↔false 轉換時 pause/resume：初始 `paused` 生效、mount 時不再覆蓋 `autoStart={false}`、identity 變動不再默默 resume 掉 imperative pause。（forwarded ref 為 `TimerHandle` 非 DOM 節點：已記錄） |

## Blocks

| 檔案 | 狀態 | 備註 |
| --- | --- | --- |
| blocks/ripple-scene.tsx | ✅ | decode 完才動畫、animationend + fallback timer 雙保險 |
| blocks/scroll-expand.tsx | ✅ | progress 直接寫 style 不經 render、geometry 每次 measure 解一次、overlay inert 切換 |
| blocks/vertical-scene.tsx | ✅ | direction render 期推導（multi-step 修法即參考此處）、預載、aria 接線完整 |

## CSS-only 變體

| 檔案 | 狀態 | 備註 |
| --- | --- | --- |
| css-only/copy-button.tsx | 🔧 | reduced-motion 覆寫因 specificity 不足是 dead code（reduce 使用者仍看到完整動畫）→ 已修；首次掛載不再播 fade-in（以 `data-interacted` 閘控） |
| css-only/smooth-height.tsx | ✅ | style 合併順序正確、reduced-motion 有效 |

## 第二輪：跨元件一致性（已全數實作）

第一輪把這幾項列為「建議但不動」，理由是「會 break API」。該理由對 registry 不成立：使用者是把檔案複製進自己的 repo、之後由自己維護，沒有 npm semver 與相依者要顧；唯一要同步的呼叫端就在本 repo 內（previews / docs），已一併更新。因此改以最佳實踐為準全部落實。

1. **ref 支援統一（22 檔）** 🔧
   `ComponentPropsWithoutRef` → `ComponentProps`（React 19 ref-as-prop）。其中 4 個元件的根節點同時被內部邏輯使用（ExpandingPanel、ExpandableTabs 的 outside-click、ContextCursor 的 bounds/native-cursor、FloatingShortcutButton 的 menuitem 查詢，以及 block ScrollExpand 的 scroll container），若只是把 `ref` 混進 rest spread，會與 `ref={rootRef}` 互相覆蓋、其中一方被靜默丟棄 → 這 5 個改用 callback ref 合併（沿用 `expanding-toggle-button.tsx` 既有寫法）。
   PlayButton / Timer / ExpandingToggleButton 維持 `forwardRef`（本來就支援 ref，無需改動）。
   新增 `tests/registry-ref-forwarding.test.tsx` 守住此契約，含「掛了 consumer ref 後內部行為仍正常」的案例。
2. **時間參數詞彙統一** 🔧
   規則：暫時狀態停留時間 → `<state>Duration`（ms）；CSS 驅動動畫 → `duration`（ms number）；Motion 驅動 → `transition`（Motion 物件）。唯一違例是 CopyButton 兩個變體的 `timeout` → 已改名 `copiedDuration`；其餘本來就符合規則。
3. **controlled prop 權威性** 🔧
   `expanding-segmented-tabs`：controlled `value` 指向 disabled/未知項時原本被靜默 remap 到第一個 enabled 項——父層狀態與 UI 分岔且不會收到 `onValueChange`。改為 controlled 值照實渲染（無對應項就沒有 active），fallback 只作用於 uncontrolled；另補 `focusableValue` 保住 roving tabindex 的鍵盤可達性（與 HighlightTabs 同一修法）。
4. **scalar value + 移除內建 demo 資料** 🔧
   `expandable-modal`：`value`/`defaultValue` 從「整個 item 物件」改為 item id（`string | null`），`onValueChange(id, item)` 兩者都給；父層可以直接存 id（例如從 URL 來）而不必持有物件參照，與 registry 其餘元件一致。
   `items` 改為必填，82 行 demo 資料（含 inline SVG data URI）移到 `components/previews/expandable-modal.tsx`——使用者不再因為忘記傳 items 就在正式環境看到 "Analytics report" 佔位內容，也不用把 demo 素材複製進自己的 codebase。
   `status-button` 預設文案同理改中性（`"Send me a login link"` → `"Submit"`、`"Login link sent!"` → `"Done"`）；首頁 showcase 本來就顯式傳入該文案，展示效果不變。

## 第三輪：清掉第一輪「記錄未修」的缺陷（已實作）

1. **`expandable-toolbar` `role="toolbar"` 無鍵盤導航** 🔧 — 宣告了 toolbar role 卻沒有方向鍵，AT 使用者被告知有、實際沒有。已實作 ArrowLeft/Right/Home/End 在可見控制項之間移動焦點；文字輸入類控制項（textarea、contenteditable、文字型 input）保留方向鍵給游標。children 是使用者任意內容，強制改寫他們的 `tabIndex` 過於侵入，因此不做 roving tabindex（tab stop 維持原樣）。可見性判斷用 `[inert]/[hidden]/[aria-hidden]`（收合面板本來就有標記）而非 `offsetParent`——後者對 `position: fixed` 的可見元素也是 null。
2. **`feedback-popover` `placeholder` 是 dead prop** 🔧 — textarea 帶著 `placeholder:text-transparent`，使用者傳什麼都看不到（浮動 label 才是實際的 placeholder）。已移除該 prop 與透明樣式，並在 `textareaLabel` 註明它同時扮演 placeholder。
3. **例外被靜默吞掉** 🔧 — `status-button` / `feedback-popover` 的 `onClick`/`onSubmit` 若 reject，狀態默默回到 idle，與「從未按過」無法區分。兩者都新增 `onError?: (error: unknown) => void`。
4. **`data-active` 值不一致** 🔧 — `projected-shadow-animation` 用 `"true"`，registry 其餘元件用 `""`。已統一為 `""`，CSS selector 改 `[data-active]`（測試斷言一併更新）。
5. **常駐 `will-change`** 🔧 — `projected-shadow` 每個 instance 3 層永久提升圖層（grid 中是實質 GPU 記憶體），已改為只在 `:hover` / `:focus-within` / `[data-active]` 時提升；`squeeze-animation` 一次性 1.5s 動畫的常駐提升已移除（其 reduced-motion 區塊本來就寫著 `will-change: auto`，意圖一致）。
6. **`sliding-list` 動畫走主執行緒** 🔧 — 原本 animate 組合過的 `transform` 字串，Motion 只能逐帧做字串插值、用不到硬體加速路徑（而 `will-change-transform` 的成本已經付了）。改為獨立的 `x` / `y` / `scale` 值。
7. **`staggered-entrance` 命名誤導** 🔧 — `opacity` / `scale` 實際是「動畫起始值」（CSS 變數本來就叫 `--staggered-entrance-from-*`），`opacity={0.5}` 會被讀成「停在 50%」。已改名 `fromOpacity` / `fromScale`。
8. **`heartbeat-animation` children 渲染兩次** 🔧 — 陰影層與可見層各一份，帶 `id` 的 children 會產生重複 id、`img`/`video` 會被複製。行為是設計本身，已在型別上方加註說明與 `showShadow={false}` 的規避方式。

## 第四輪：最後 7 項（全數實作）

1. **`expanding-slider` RTL** 🔧 — 原本全檔假設 LTR，在 RTL 文件下填充方向與指標映射相反、方向鍵語意也錯。改為讀取 rail 的 resolved `direction`（用 computed style，所以樹上任何 `dir` 或 CSS `direction` 都算），RTL 時鏡射指標比例、並反轉水平方向鍵（ArrowLeft 遞增，垂直鍵與 PageUp/Down 保持絕對語意）；視覺定位從物理屬性 `left-*` 改為邏輯屬性 `start-*`，兩個方向自動正確。新增 RTL 與 LTR 對照測試。
2. **`timer` ref 形狀** 🔧 — forwarded ref 原本是 `TimerHandle`，與 registry 其餘元件（ref = DOM 節點）不一致，也讓消費者無法量測或滾動到該元素。改為 `ref` 指向 `<time>`、命令式控制移到新的 `controlsRef` prop；順帶把 `forwardRef` 改成 React 19 的 ref-as-prop。preview 與測試已更新，並加斷言確認 `ref` 給的是 `HTMLTimeElement`。
3. **`floating-select` 受控開關與 root 透傳** 🔧 — 補上 `open`/`defaultOpen`/`onOpenChange` 三件套（原本無法在路由變更等情境程式化關閉），props 改為繼承 div props 以支援 rest spread / `ref` / `id`，並新增 `wrapperClassName` 讓外層 `fixed`/`z-50` 的 stacking context 可覆寫而不必 fork。
4. **`otp-input` 命令式 focus** 🔧 — 新增 `inputRef`（root `ref` 指向不可聚焦的容器，無法用來 focus）。內部同樣做 ref 合併。
5. **`multi-step` `currentStep` → `step`** 🔧 — React 慣例是受控 prop 與 default prop 共用名詞（`value`/`defaultValue`、`open`/`defaultOpen`），原本 `currentStep`/`defaultStep` 不對稱。已改名並更新呼叫端。
6. **`status-badge` live region** 🔧 — 一個專門表達狀態轉換的元件卻不會播報（icon 是 `aria-hidden`，單純換文字不觸發播報）。改為讓 badge **本身**成為 `role="status" aria-live="polite"`，可用 `announce={false}` 關閉、也可用 props 覆寫 role。
   *實作過程修正*：第一版是額外加一個 sr-only 複本，測試立刻抓到標籤在 DOM 出現兩次——那同時意味著螢幕閱讀器會把標籤唸兩遍。改成把 role 放在既有節點上，文字只存在一份。
7. **`expandable-modal` 圖片 decode** 🔧 — 原本 `await` 無上限，首次點擊慢速遠端圖片時完全沒有回饋。改為與 200ms 預算競速，超時就先開，圖片稍後補上。

### 仍維持現狀

- **slot class API 兩套並存**：`classNames` 物件（多 slot 元件）vs 平面 `*ClassName`。這不是不一致，而是依 slot 數量選用，多 slot 用物件更好；已在文件說明，不強行統一。
- **正向確認**：全 registry 的 controlled/uncontrolled 皆為正確的 non-latching 模式；所有動畫元件都處理 `prefers-reduced-motion`；effect / observer / timer cleanup 普遍正確——這三點是本 registry 的強項。

## 驗證

- [x] pnpm lint
- [x] pnpm typecheck
- [x] pnpm display:check
- [x] pnpm test（219/219 通過）
- [x] pnpm registry:build

測試變更彙總：
- 更新斷言：status-button（新增 aria-live 播報）、projected-shadow（`data-active` 統一為 `""`）、countdown（`ref` → `controlsRef`）
- 新增檔案：`tests/registry-ref-forwarding.test.tsx`（root ref 合併契約）、`tests/status-badge.test.tsx`（live region 與不重複朗讀）
- 新增案例：expandable-toolbar 方向鍵導航與文字欄位例外、expanding-slider RTL/LTR 對照、countdown 的 `ref` 指向 `<time>`
