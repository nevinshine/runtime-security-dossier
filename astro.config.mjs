import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nevinshine.github.io',
  base: '/research-dossier',

  integrations: [
    starlight({
      title: 'Research Dossier',
      
      // FIXED: The property MUST be 'href'
      social: [
        {
          label: 'GitHub',
          href: 'https://github.com/nevinshine',
          icon: 'github',
        },
      ],
      customCss: ['./src/styles/custom.css'],

      sidebar: [
        // Group 1: Automatically list everything in the '100-days' folder
        {
            label: '100 Days of DevSecOps',
            autogenerate: { directory: '100-days' },
        },
        // Group 2: Automatically list everything in the 'sentinel' folder
        {
            label: 'Sentinel Sandbox',
            autogenerate: { directory: 'sentinel' },
        },
    ],
    }),
  ],
});
