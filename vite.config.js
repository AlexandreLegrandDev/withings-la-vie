import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import {
    defineConfig
} from 'vite';
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

// Le manifest est généré dans public/build : on corrige son chemin dans la liste du service worker,
// sinon il chercherait /manifest.webmanifest (404) et ne s'installerait pas.
const pwaManifestPath = {
    name: 'pwa-manifest-path',
    buildStart() {
        const pwa = this.environment?.config.plugins.find((p) => p.name === 'vite-plugin-pwa');
        pwa?.api?.extendManifestEntries((entries) =>
            entries.map((e) => (e.url === 'manifest.webmanifest' ? { ...e, url: 'build/manifest.webmanifest' } : e)),
        );
    },
};

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        // PWA : rend l'app installable sur le téléphone.
        // Le service worker est écrit à la racine de public/ (et non dans public/build) pour contrôler
        // tout le site, pas seulement /build/. Le manifest, lui, reste dans /build/manifest.webmanifest.
        VitePWA({
            outDir: 'public',
            base: '/',
            scope: '/',
            buildBase: '/',
            registerType: 'autoUpdate',
            injectRegister: false, // enregistré à la main dans app.tsx (pas de index.html avec Laravel)
            manifest: {
                name: 'Withings la vie',
                short_name: 'Withings la vie',
                lang: 'fr',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#ffffff',
                theme_color: '#ffffff',
                icons: [
                    { src: '/icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
                    { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                // Met en cache le JS/CSS compilé ; les pages, elles, viennent toujours du serveur (Inertia)
                globDirectory: 'public',
                globPatterns: ['build/assets/**/*.{js,css,woff2}', 'icons/*.{png,svg}'],
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            },
        }),
        pwaManifestPath,
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
