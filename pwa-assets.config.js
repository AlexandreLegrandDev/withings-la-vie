import { defineConfig } from '@vite-pwa/assets-generator/config';

// Génère les icônes PNG de l'app à partir de public/icons/icon.svg : npx pwa-assets-generator
// Le SVG a déjà son fond blanc et ses marges, donc aucun padding ajouté.
const options = { padding: 0, resizeOptions: { background: '#ffffff' } };

export default defineConfig({
    preset: {
        transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], ...options },
        maskable: { sizes: [512], ...options },
        apple: { sizes: [180], ...options },
    },
    images: ['public/icons/icon.svg'],
});
