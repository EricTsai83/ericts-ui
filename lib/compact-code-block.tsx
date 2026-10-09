import { toHtml } from "hast-util-to-html";
import {
  ServerCodeBlock,
  type ServerCodeBlockProps,
} from "fumadocs-ui/components/codeblock.rsc";

/**
 * Keep Fumadocs' interactive wrapper, but send syntax tokens as escaped HTML
 * rather than thousands of individual React nodes in the RSC payload.
 */
export async function CompactCodeBlock(options: ServerCodeBlockProps) {
  let html = "";

  return ServerCodeBlock({
    ...options,
    transformers: [
      ...(options.transformers ?? []),
      {
        root() {
          // Serialize Shiki's final token tree, never the raw source as HTML.
          // toHtml escapes source text, including HTML-looking code samples.
          html = toHtml(this.code.children);
        },
      },
    ],
    components: {
      ...options.components,
      code: (props) => {
        const attributes = { ...props };
        delete attributes.children;

        return <code {...attributes} dangerouslySetInnerHTML={{ __html: html }} />;
      },
    },
  });
}
