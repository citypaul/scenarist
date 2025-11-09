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
				{
					label: 'Introduction',
					items: [
						{ label: 'Overview', slug: 'introduction/overview' },
						{ label: 'Why Scenarist?', slug: 'introduction/why-scenarist' },
						{ label: 'Quick Start', slug: 'introduction/quick-start' },
						{ label: 'Installation', slug: 'introduction/installation' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: [
				'./src/styles/custom.css',
			],
		}),
	],
});
