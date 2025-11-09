// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Scenarist',
			description: 'Fix E2E testing for Next.js, Remix, and TanStack',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/citypaul/scenarist'
				}
			],
			sidebar: [
				// Phase 1: Minimal navigation - content pages will be added in Phase 2
				// Introduction pages exist but are placeholders, so not shown in navigation yet
			],
			customCss: [
				'./src/styles/custom.css',
			],
		}),
	],
});
