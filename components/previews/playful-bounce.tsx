"use client";

import type * as React from "react";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { PlayfulBounce } from "@/registry/base/ui/playful-bounce";

const ink = "#5b2f1f";
const eye = "#3b1f14";

function Star(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" {...props}>
      <path
        d="M40 9l8.8 18.2 20 2.7-14.6 13.9 3.6 19.8L40 54.1 22.2 63.6l3.6-19.8L11.2 29.9l20-2.7z"
        fill="#ffd84d"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M30 31l4-5"
        stroke="#fff6c2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30.5 38.5q3-4 6 0M43.5 38.5q3-4 6 0"
        fill="none"
        stroke={eye}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M36.5 44q3.5 3.5 7 0"
        fill="none"
        stroke={eye}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <ellipse cx="28.5" cy="44" rx="3.2" ry="2" fill="#ff7a59" opacity=".5" />
      <ellipse cx="51.5" cy="44" rx="3.2" ry="2" fill="#ff7a59" opacity=".5" />
    </svg>
  );
}

function Heart(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" {...props}>
      <path
        d="M40 66C26 56 11 45 11 30c0-9 7-16 15-16c6 0 11 3 14 8c3-5 8-8 14-8c8 0 15 7 15 16c0 15-15 26-29 36z"
        fill="#ff6b8b"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M20 27q1-5 6-6"
        fill="none"
        stroke="#ffc2d0"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="33.5" cy="38" r="2.6" fill={eye} />
      <circle cx="46.5" cy="38" r="2.6" fill={eye} />
      <circle cx="34.3" cy="37.2" r=".9" fill="#fff" />
      <circle cx="47.3" cy="37.2" r=".9" fill="#fff" />
      <path
        d="M37.5 42.5q2.5 2.5 5 0"
        fill="none"
        stroke={eye}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <ellipse cx="28" cy="43" rx="3.2" ry="2" fill="#ff2e63" opacity=".45" />
      <ellipse cx="52" cy="43" rx="3.2" ry="2" fill="#ff2e63" opacity=".45" />
    </svg>
  );
}

function RiceBall(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" {...props}>
      <path
        d="M40 11c6 0 9 4 13 11l12 22c5 10 1 22-12 22H27c-13 0-17-12-12-22l12-22c4-7 7-11 13-11z"
        fill="#fffaf0"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M29 50h22v16H29z"
        fill="#2f4a3a"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M33 25q2-2 4-1"
        fill="none"
        stroke="#e9dcc6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="33.5" cy="38" r="2.6" fill={eye} />
      <circle cx="46.5" cy="38" r="2.6" fill={eye} />
      <circle cx="34.3" cy="37.2" r=".9" fill="#fff" />
      <circle cx="47.3" cy="37.2" r=".9" fill="#fff" />
      <path
        d="M37.5 42.5q2.5 2.5 5 0"
        fill="none"
        stroke={eye}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <ellipse cx="28.5" cy="43" rx="3.2" ry="2" fill="#ff7a8a" opacity=".5" />
      <ellipse cx="51.5" cy="43" rx="3.2" ry="2" fill="#ff7a8a" opacity=".5" />
    </svg>
  );
}

const friends = [
  { name: "star", Art: Star },
  { name: "heart", Art: Heart },
  { name: "rice ball", Art: RiceBall },
];

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-end gap-6 sm:gap-10">
            {friends.map(({ name, Art }) => (
              <PlayfulBounce
                key={`${name}-${replayKey}`}
                autoPlay
                trigger="click"
              >
                <button
                  type="button"
                  aria-label={`Bounce the ${name}`}
                  className="rounded-xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Art className="size-16 sm:size-20" />
                </button>
              </PlayfulBounce>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            A little jump for a little joy. Tap to replay.
          </p>
        </div>
      )}
    </ReplayablePreview>
  );
}
