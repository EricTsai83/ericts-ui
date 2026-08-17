"use client";

import * as React from "react";
import {
  BotIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

type DocsCopyPageProps = {
  /** Same-origin path to the raw Markdown, fetched only when the user copies. */
  markdownPath: string;
  /** Absolute page URL, for prompts handed to an external assistant. */
  url: string;
};

const promptTargets = [
  {
    label: "Open in v0",
    baseUrl: "https://v0.dev/chat",
    icon: SparklesIcon,
  },
  {
    label: "Open in ChatGPT",
    baseUrl: "https://chatgpt.com",
    icon: BotIcon,
  },
  {
    label: "Open in Claude",
    baseUrl: "https://claude.ai/new",
    icon: SparklesIcon,
  },
] as const;

function getPromptUrl(baseUrl: string, url: string) {
  const prompt = `I'm looking at this ericts/ui documentation: ${url}.
Help me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.`;

  return `${baseUrl}?q=${encodeURIComponent(prompt)}`;
}

function legacyCopyToClipboard(value: string) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.select();

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textArea);
  return copied;
}

export function DocsCopyPage({ markdownPath, url }: DocsCopyPageProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const copyPage = React.useCallback(async () => {
    let page: string;

    try {
      const response = await fetch(markdownPath);

      if (!response.ok) {
        return;
      }

      page = await response.text();
    } catch {
      return;
    }

    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(page);
        copied = true;
      } catch {
        copied = legacyCopyToClipboard(page);
      }
    } else {
      copied = legacyCopyToClipboard(page);
    }

    if (!copied) {
      return;
    }

    setIsCopied(true);

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    resetTimer.current = setTimeout(() => setIsCopied(false), 2000);
  }, [markdownPath]);

  return (
    <div className="relative flex rounded-lg bg-secondary *:[[data-slot=button]]:focus-visible:relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-8 rounded-r-none shadow-none md:h-7 md:text-[0.8rem]"
        data-copied={isCopied}
        onClick={copyPage}
      >
        {isCopied ? (
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
        ) : (
          <CopyIcon data-icon="inline-start" aria-hidden="true" />
        )}
        Copy Page
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {isCopied ? "Page copied to clipboard" : ""}
      </span>
      <Separator
        orientation="vertical"
        className="absolute right-8 top-1 h-6 bg-foreground/5 md:right-7 md:h-5"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="-ml-px size-8 rounded-l-none shadow-none md:size-7"
              aria-label="More page actions"
            />
          }
        >
          <ChevronDownIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 shadow-none">
          <DropdownMenuGroup>
            <DropdownMenuItem
              render={
                <a href={markdownPath} target="_blank" rel="noreferrer" />
              }
            >
              <FileTextIcon aria-hidden="true" />
              View as Markdown
            </DropdownMenuItem>
            {promptTargets.map(({ label, baseUrl, icon: Icon }) => (
              <DropdownMenuItem
                key={label}
                render={
                  <a
                    href={getPromptUrl(baseUrl, url)}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <Icon aria-hidden="true" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
