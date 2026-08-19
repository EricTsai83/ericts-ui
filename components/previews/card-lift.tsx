"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpDown,
  CircleHelp,
  Info,
  Send,
  Settings,
  Snowflake,
  SlidersHorizontal,
  QrCode,
  ScrollText,
} from "lucide-react";

import { CardLift, type CardLiftItem } from "@/registry/base/blocks/card-lift";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Deposit", icon: ArrowDownToLine },
  { label: "Send", icon: Send },
  { label: "Request", icon: QrCode },
  { label: "Transfer", icon: ArrowUpDown },
] as const;

const accounts = [
  { name: "Benji", apy: "6.00% APY", balance: "$1,279.97" },
  { name: "Extra", apy: "6.00% APY", balance: "$0" },
] as const;

const cardActions = [
  { label: "Freeze", icon: Snowflake },
  { label: "Limits", icon: SlidersHorizontal },
  { label: "Statement", icon: ScrollText },
] as const;

type CardModel = {
  id: string;
  label: string;
  name: string;
  /**
   * Every coloured face is `bg-foreground` under a low-opacity tint, so the
   * card reads as its own colour while `text-background` stays legible in both
   * themes — a raw chart colour flips lightness between them and one mode loses.
   */
  tone: "dark" | "silver";
  tint?: string;
  last4: string;
  spend: string;
  limit: string;
  status: string;
  transactions: ReadonlyArray<{
    merchant: string;
    detail: string;
    amount: string;
  }>;
};

const cards: readonly CardModel[] = [
  {
    id: "virtual",
    label: "Virtual card",
    name: "Virtual",
    tone: "dark",
    last4: "4921",
    spend: "$412.60",
    limit: "$1,500 monthly limit",
    status: "Active",
    transactions: [
      { merchant: "The Truck Stop", detail: "Today · 11:24", amount: "$18.40" },
      { merchant: "Rail & Anchor", detail: "Today · 09:02", amount: "$6.75" },
      { merchant: "Northside Market", detail: "Yesterday", amount: "$54.12" },
      { merchant: "Ferry Pass", detail: "Mon", amount: "$12.00" },
      { merchant: "Corner Roasters", detail: "Mon", amount: "$4.85" },
      { merchant: "Studio Supply Co.", detail: "Sun", amount: "$96.30" },
    ],
  },
  {
    id: "physical",
    label: "Physical card",
    name: "Physical",
    tone: "silver",
    last4: "8830",
    spend: "$96.10",
    limit: "$800 monthly limit",
    status: "Arriving Friday",
    transactions: [
      { merchant: "Harborline Fuel", detail: "Yesterday", amount: "$41.20" },
      { merchant: "Green Room Deli", detail: "Sat", amount: "$22.90" },
      { merchant: "Bay Parking", detail: "Sat", amount: "$8.00" },
      { merchant: "Field Notes Press", detail: "Fri", amount: "$24.00" },
    ],
  },
  {
    id: "travel",
    label: "Travel card",
    name: "Travel",
    tone: "dark",
    tint: "bg-chart-2/35",
    last4: "2107",
    spend: "$1,284.00",
    limit: "No preset limit",
    status: "Trip mode",
    transactions: [
      { merchant: "Kestrel Air", detail: "Thu", amount: "$642.00" },
      { merchant: "Hotel Marisol", detail: "Thu", amount: "$318.00" },
      { merchant: "Terminal Exchange", detail: "Thu", amount: "$60.00" },
      { merchant: "Coastal Rail", detail: "Wed", amount: "$74.50" },
    ],
  },
  {
    id: "rewards",
    label: "Rewards card",
    name: "Rewards",
    tone: "dark",
    tint: "bg-chart-1/35",
    last4: "6642",
    spend: "$208.75",
    limit: "3% back on groceries",
    status: "1,940 pts",
    transactions: [
      { merchant: "Vine & Grain", detail: "Yesterday", amount: "$88.20" },
      { merchant: "Lamplight Books", detail: "Tue", amount: "$31.55" },
      { merchant: "Sunday Grocer", detail: "Sun", amount: "$64.00" },
      { merchant: "Ridgeway Cinema", detail: "Sat", amount: "$25.00" },
    ],
  },
];

function CardFace({ card }: { card: CardModel }) {
  return (
    <div
      className={cn(
        "relative flex size-full flex-col justify-between p-4",
        card.tone === "dark"
          ? "bg-foreground text-background"
          : "bg-linear-to-br from-muted to-secondary text-foreground",
      )}
    >
      {card.tint ? (
        <div aria-hidden="true" className={cn("absolute inset-0", card.tint)} />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[repeating-linear-gradient(112deg,currentColor_0_1px,transparent_1px_22px)] opacity-15"
      />

      <div className="relative flex items-start justify-between">
        <span className="rounded-full border border-current/25 px-2.5 py-0.5 text-[0.7rem] font-medium">
          {card.name}
        </span>
        <span
          aria-hidden="true"
          className="h-6 w-8 rounded-[0.3rem] border border-current/30 bg-current/15"
        />
      </div>

      <div className="relative flex items-end justify-between">
        <span className="font-mono text-sm tracking-[0.18em] tabular-nums">
          ···· {card.last4}
        </span>
        <span className="text-[0.7rem] font-medium opacity-70">12/29</span>
      </div>
    </div>
  );
}

function CardDetail({ card }: { card: CardModel }) {
  return (
    <div className="flex flex-col gap-5 px-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{card.name} card</p>
          <span
            aria-hidden="true"
            className="size-1 rounded-full bg-muted-foreground/50"
          />
          <p className="text-sm text-muted-foreground">{card.status}</p>
        </div>
        <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums">
          {card.spend}
        </p>
        <p className="text-sm text-muted-foreground">
          Spent this month · {card.limit}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cardActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/60 px-2 py-3 text-xs font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <action.icon aria-hidden="true" className="size-4" />
            {action.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p className="pb-1 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Recent
        </p>
        <ul className="flex flex-col">
          {card.transactions.map((transaction) => (
            <li
              key={transaction.merchant}
              className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-8 shrink-0 rounded-full bg-muted"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {transaction.merchant}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {transaction.detail}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums">
                −{transaction.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const items: CardLiftItem[] = cards.map((card) => ({
  id: card.id,
  label: card.label,
  face: <CardFace card={card} />,
  detail: <CardDetail card={card} />,
}));

function MoneyPage() {
  return (
    <div className="flex h-full flex-col gap-5 px-5 pt-4">
      <header className="flex items-center justify-between">
        <ArrowLeft aria-hidden="true" className="size-5" />
        <p className="text-base font-semibold">Money</p>
        <div className="flex items-center gap-3 text-muted-foreground">
          <CircleHelp aria-hidden="true" className="size-5" />
          <Settings aria-hidden="true" className="size-5" />
        </div>
      </header>

      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Total Balance</p>
        <p className="text-[2.75rem] leading-none font-semibold tracking-[-0.05em] tabular-nums">
          $1,279.97
        </p>
        <p className="flex items-center gap-1.5 pt-1 text-sm text-muted-foreground">
          Your assets are safe
          <Info aria-hidden="true" className="size-3.5" />
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/60 px-1 py-3 text-xs font-medium"
          >
            <action.icon aria-hidden="true" className="size-4" />
            {action.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
          <p className="text-sm font-semibold">Earnings</p>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Lifetime</span>
            <span className="font-mono tabular-nums">$94.33</span>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">This month</span>
            <span className="font-mono text-chart-2 tabular-nums">$3.00</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
          <p className="text-sm font-semibold">Activity</p>
          {[
            ["The Truck…", "+$0.18"],
            ["RSenatorFeed", "+$1"],
          ].map(([name, amount]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full bg-muted-foreground/25"
                />
                <span className="truncate text-muted-foreground">{name}</span>
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums">
                {amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WalletSheet() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-5">
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-2/20 text-chart-2"
        >
          <ArrowDownToLine className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">
            Set Up Direct Deposit
          </span>
          <span className="truncate text-sm text-muted-foreground">
            Get your paycheck early
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {accounts.map((account) => (
          <div
            key={account.name}
            className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-6 shrink-0 rounded-full bg-muted-foreground/25"
              />
              <span className="truncate text-sm font-semibold">
                {account.name}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-xs text-chart-2">{account.apy}</span>
              <span className="text-xl font-semibold tracking-[-0.03em] tabular-nums">
                {account.balance}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Preview({
  presentation = "inline",
}: {
  variant: string;
  presentation?: "inline" | "fullscreen";
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-96 justify-center",
        presentation === "fullscreen"
          ? "h-full"
          : "h-[min(44rem,78svh)] min-h-[36rem]",
      )}
    >
      <CardLift
        items={items}
        sheet={<WalletSheet />}
        deckLabel="Your cards"
        className="h-full w-full rounded-[1.75rem] border shadow-sm"
        cardClassName="shadow-lg"
        sheetClassName="border-x"
      >
        <MoneyPage />
      </CardLift>
    </div>
  );
}
