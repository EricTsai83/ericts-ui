// @vitest-environment jsdom

import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CompactCodeBlock } from "@/lib/compact-code-block";

function parseMarkup(markup: string) {
  const document = new DOMParser().parseFromString(markup, "text/html");
  // React and the HAST serializer format equivalent CSS differently.
  for (const element of document.querySelectorAll<HTMLElement>("[style]")) {
    element.setAttribute("style", element.style.cssText);
  }
  return document;
}

describe("compact code block", () => {
  it.each([
    { lang: "tsx", code: 'export const Demo = () => <button title="a&b">Hello</button>;' },
    { lang: "ts", code: 'const greeting: string = "hello";\n\nexport { greeting };' },
    { lang: "css", code: '.demo {\n  color: red;\n  --label: "<div>&";\n}' },
  ])("preserves rendered syntax, styles, and line numbers for $lang", async ({ lang, code }) => {
    const options = {
      code,
      lang,
      codeblock: { allowCopy: false, "data-line-numbers": true },
    };
    const original = parseMarkup(renderToStaticMarkup(await ServerCodeBlock(options)));
    const compact = parseMarkup(renderToStaticMarkup(await CompactCodeBlock(options)));

    expect(compact.body.innerHTML).toBe(original.body.innerHTML);
    expect(compact.querySelector("code")?.textContent).toBe(code);
  });

  it("escapes HTML-looking source rather than creating active elements", async () => {
    const code = '<script>alert("x")</script>\n<img src=x onerror=alert(1)> &amp;';
    const compact = parseMarkup(renderToStaticMarkup(await CompactCodeBlock({
      code,
      lang: "html",
      codeblock: { allowCopy: false },
    })));

    expect(compact.querySelector("code")?.textContent).toBe(code);
    expect(compact.querySelector("script, img")).toBeNull();
  });
});
