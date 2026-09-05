import { visit } from 'unist-util-visit';

/**
 * Rehype plugin that rewrites absolute root-relative links (href starting
 * with `/`) to include the Astro `base` path.  This is necessary because
 * Astro's `base` config only applies to its own routing — it does NOT
 * rewrite raw `<a href>` inside Markdown output.
 *
 * When deploying to a project page like
 * `https://flyskypie.github.io/behaviortrees-docs/`
 * the base is `/behaviortrees-docs/`, so `/?example=open-the-door`
 * becomes `/behaviortrees-docs/?example=open-the-door`.
 *
 * Two cases handled:
 * 1. Parsed `<a>` elements from Markdown link syntax `[text](/path)`
 * 2. Inline HTML `<a>` in `.md` files (AST type `raw`)
 *
 * @param {string} base — the base path (e.g. `/behaviortrees-docs/` or `/`)
 */
export function rehypeBaseLinks(base) {
    return (tree) => {
        if (!base || base === '/') return;

        visit(tree, (node) => {
            // Handle parsed <a> elements from Markdown syntax [text](/path)
            if (node.type === 'element' && node.tagName === 'a') {
                const href = node.properties?.href;
                if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
                    node.properties.href = base.replace(/\/$/, '') + href;
                }
                return;
            }

            // Handle inline HTML in .md files — it comes as raw text nodes
            // (e.g. <a class="try-editor" href="/?example=...">)
            if (node.type === 'raw') {
                node.value = node.value.replace(
                    /(<a\s[^>]*?href\s*=\s*")(\/[^"]*)(")/gi,
                    (_, before, path, after) => {
                        if (path.startsWith('//') || path.startsWith('/_astro')) return _;
                        return before + base.replace(/\/$/, '') + path + after;
                    },
                );
            }
        });
    };
}