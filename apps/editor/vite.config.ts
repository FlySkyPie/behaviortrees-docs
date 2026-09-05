import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

// The example trees live in @behaviortrees/examples (single source of truth,
// shared with the classic editor). Serve them at /examples in dev and copy
// them into dist/examples on build so /?example=<name> works everywhere.
const EXAMPLES_DIR = join(
	dirname(require.resolve('@behaviortrees/examples/package.json')),
	'trees'
);

const examplesPlugin = (): Plugin => ({
	name: 'shared-examples',
	configureServer(server) {
		server.middlewares.use('/examples', (req, res, next) => {
			const url = (req as { url?: string }).url ?? '';
			const name = url.replace(/^\//, '').split('?')[0];
			if (!/^[\w-]+\.json$/.test(name)) return next();
			try {
				const body = readFileSync(join(EXAMPLES_DIR, name));
				res.setHeader('Content-Type', 'application/json');
				res.end(body);
			} catch {
				next();
			}
		});
	},
	closeBundle() {
		const out = join(HERE, 'dist/examples');
		mkdirSync(out, { recursive: true });
		for (const file of readdirSync(EXAMPLES_DIR)) {
			if (file.endsWith('.json')) {
				copyFileSync(join(EXAMPLES_DIR, file), join(out, file));
			}
		}
	},
});

export default defineConfig({
	// When deploying to a GitHub Pages project page (user.github.io/repo), set
	// GH_PAGES_BASE=/repo-name/ in the workflow env so assets resolve correctly.
	base: process.env.GH_PAGES_BASE || '/',
	plugins: [react(), tailwindcss(), examplesPlugin()],
	server: {
		// The sync API runs as Vercel functions; in dev, run `vercel dev --listen
		// 3000` alongside vite so /api hits real functions while keeping HMR.
		proxy: {
			'/api': 'http://localhost:3000',
		},
	},
	test: {
		// Tests must not see GH_PAGES_BASE – it breaks assertions on element
		// existence because /<repo>/ prefix is never present in test DOM.
		env: { GH_PAGES_BASE: '', VITE_CLERK_PUBLISHABLE_KEY: '' },
	},
});