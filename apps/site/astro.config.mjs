import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeBaseLinks } from './src/rehype-base-links.js';

const SITE = 'https://www.behaviortrees.com';

// Draft articles still build (previewable at their URL, noindex'd by the
// layout) but must not be advertised in the sitemap. The sitemap filter only
// sees URLs, so read the frontmatter here to learn which slugs are drafts.
const learnDir = join(dirname(fileURLToPath(import.meta.url)), 'src/pages/learn');
const draftUrls = new Set(
    readdirSync(learnDir)
        .filter((file) => file.endsWith('.md'))
        .filter((file) => {
            const frontmatter = readFileSync(join(learnDir, file), 'utf8').split('---')[1] ?? '';
            return /^draft:\s*true\s*$/m.test(frontmatter);
        })
        .map((file) => `${SITE}/learn/${file.replace(/\.md$/, '')}/`)
);

export default defineConfig({
    site: SITE,
    trailingSlash: 'always',
    // When deploying to a GitHub Pages project page (user.github.io/repo),
    // set GH_PAGES_BASE=/repo-name/ in the workflow env so links resolve
    // under the subpath. Defaults to '/' (domain root / custom domain).
    base: process.env.GH_PAGES_BASE || '/',
    integrations: [
        sitemap({
            filter: (page) => !draftUrls.has(page),
            // The editor app lives at / outside this Astro build
            customPages: [`${SITE}/`],
        }),
    ],
    build: {
        format: 'directory',
    },
    markdown: {
        rehypePlugins: [
            [rehypeBaseLinks, process.env.GH_PAGES_BASE || '/'],
        ],
    },
});
