import type { ComponentType, ReactNode } from "react";

import type { ComponentCodeFile } from "@/components/component-showcase";
import { CodeSnippet, DocLink, InlineCode } from "@/components/registry-prose";

type SnippetLookup = (name: string) => ComponentCodeFile | undefined;

type RegistryGuideProps = {
  name: string;
  snippets: ComponentCodeFile[];
};

/**
 * Renders the long-form guide for a registry item, when it has one. Guides are
 * keyed by item name so the showcase itself stays generic.
 */
export function RegistryGuide({ name, snippets }: RegistryGuideProps) {
  const Guide = registryGuides[name];

  if (!Guide) {
    return null;
  }

  return (
    <section className="flex min-w-0 max-w-3xl flex-col gap-10">
      <Guide snippet={(file) => snippets.find((s) => s.name === file)} />
    </section>
  );
}

function NavLinkGuide({ snippet }: { snippet: SnippetLookup }) {
  const layoutSnippet = snippet("app/layout.tsx");

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          Why not just next/link?
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Based on{" "}
          <DocLink href="https://aurorascharff.no/posts/building-an-active-navlink-component-in-nextjs/">
            Building an active NavLink component in Next.js
          </DocLink>{" "}
          by Aurora Scharff.
        </p>
        <p className="text-sm leading-6 text-foreground">
          <DocLink href="https://nextjs.org/docs/app/api-reference/components/link">
            <InlineCode>next/link</InlineCode>
          </DocLink>{" "}
          performs the navigation and deliberately leaves its <em>state</em> to
          the app: whether this link is the current location, whether a parent
          section owns the current page, and whether a slow click was received.
          NavLink renders the real Link and adds only that state.
        </p>
      </div>

      <GuideSection
        title="Link does not know if it is the current location"
        snippet={snippet("sidebar-nav.tsx")}
        caption="A plain class string and static children stay serializable, so a Server Component can render this navigation."
      >
        Every navigation surface ends up repeating{" "}
        <InlineCode>usePathname()</InlineCode>, a matching function, active
        classes, and <InlineCode>aria-current</InlineCode> — then drifting apart
        between sidebar, header, and tabs. NavLink resolves it once and exposes{" "}
        <InlineCode>isActive</InlineCode>, <InlineCode>isExact</InlineCode>, and{" "}
        <InlineCode>data-active</InlineCode>, with{" "}
        <InlineCode>aria-current=&quot;page&quot;</InlineCode> for a leaf and{" "}
        <InlineCode>&quot;location&quot;</InlineCode> for an active parent.
      </GuideSection>

      <GuideSection
        title="The current page can also belong to a parent section"
        snippet={snippet("match-modes.tsx")}
      >
        Projects should stay selected on{" "}
        <InlineCode>/dashboard/projects/acme</InlineCode>, but a naive{" "}
        <InlineCode>startsWith()</InlineCode> also lights up{" "}
        <InlineCode>/projects-archive</InlineCode>. A link matches{" "}
        <InlineCode>exact</InlineCode> by default, so nothing highlights by
        accident; a section opts in with{" "}
        <InlineCode>match=&quot;prefix&quot;</InlineCode>, which respects whole
        path segments. Query strings, hashes, and trailing slashes are
        normalized away in both modes.
      </GuideSection>

      <GuideSection
        title="A slow navigation gives no feedback"
        snippet={snippet("pending-link.tsx")}
      >
        A prefetched route usually updates immediately, so{" "}
        <DocLink href="https://nextjs.org/docs/app/api-reference/functions/use-link-status">
          <InlineCode>useLinkStatus()</InlineCode>
        </DocLink>{" "}
        never reports a wait — a spinner on every link only makes fast
        navigation feel slow. Reach for{" "}
        <InlineCode>isPending</InlineCode> when prefetching is off or the
        destination must fetch before the URL can change, and delay the
        indicator ~150ms so quick transitions stay silent.
      </GuideSection>

      <article className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          State it exposes
        </h3>
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <GuideDefinition
            term="isActive"
            description="The exact destination, or a matching descendant under prefix matching."
          />
          <GuideDefinition
            term="isExact"
            description="The normalized current pathname equals the destination."
          />
          <GuideDefinition
            term="isPending"
            description="The clicked link is waiting for Next.js to update history. Function children only."
          />
          <GuideDefinition
            term="data-active"
            description="Set on the active anchor, for static CSS without a render function."
          />
          <GuideDefinition
            term="aria-current"
            description='"page" for the exact page, "location" for an active parent section.'
          />
          <GuideDefinition
            term="ref"
            description="The rendered anchor, following the React 19 ref-as-prop contract."
          />
        </dl>
      </article>

      <article className="flex min-w-0 flex-col gap-4">
        <h3 className="text-lg font-semibold tracking-tight">Design notes</h3>
        <ul className="flex list-disc flex-col gap-3 pl-5 text-sm leading-6 text-foreground marker:text-muted-foreground/50">
          <li>
            It always renders Next.js Link, so prefetching, modifier keys,
            history, and scroll behavior are untouched, and{" "}
            <InlineCode>href</InlineCode> stays generic over{" "}
            <InlineCode>Route&lt;T&gt;</InlineCode> to keep{" "}
            <DocLink href="https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes">
              typed routes
            </DocLink>{" "}
            checked.
          </li>
          <li>
            The pathname read sits in its own Suspense boundary with a real,
            inactive Link as the fallback, so a dynamic route cannot blank out
            the layout. Pass <InlineCode>currentPathname</InlineCode> to skip
            that read when the app already knows the canonical path — rewrites,
            previews, tests.
          </li>
          <li>
            <InlineCode>NavLinkScript</InlineCode> is optional. Rendered once at
            the end of the root body, it sets{" "}
            <InlineCode>data-active</InlineCode> and{" "}
            <InlineCode>aria-current</InlineCode> during HTML parsing, for a
            shell that must look correct before hydration. It only affects
            attribute-based CSS, and skips links that pass{" "}
            <InlineCode>currentPathname</InlineCode>.
          </li>
          <li>
            Requires the Next.js App Router;{" "}
            <InlineCode>isPending</InlineCode> needs Next.js 15.3 or later.
            Function <InlineCode>className</InlineCode> and children are client
            values and cannot cross a Server-to-Client boundary. Absolute URLs,
            relative hrefs, and bare <InlineCode>#</InlineCode> or{" "}
            <InlineCode>?</InlineCode> hrefs are never marked active.
          </li>
        </ul>
        {layoutSnippet ? <CodeSnippet snippet={layoutSnippet} /> : null}
      </article>
    </>
  );
}

const registryGuides: Partial<
  Record<string, ComponentType<{ snippet: SnippetLookup }>>
> = {
  "nav-link": NavLinkGuide,
};

function GuideSection({
  title,
  children,
  snippet,
  caption,
}: {
  title: string;
  children: ReactNode;
  snippet?: ComponentCodeFile;
  caption?: string;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-6 text-foreground">{children}</p>
      {snippet ? <CodeSnippet snippet={snippet} /> : null}
      {caption ? (
        <p className="text-sm leading-6 text-muted-foreground">{caption}</p>
      ) : null}
    </article>
  );
}

function GuideDefinition({
  term,
  description,
}: {
  term: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt>
        <InlineCode>{term}</InlineCode>
      </dt>
      <dd className="leading-6 text-foreground">{description}</dd>
    </div>
  );
}
