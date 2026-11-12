import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import NavLayout from './layouts/nav-layout';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Veggings';

type PageModule = { default: ComponentType & { layout?: (page: ReactNode) => ReactNode } };

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent<PageModule>(`./pages/${name}.tsx`, import.meta.glob<PageModule>('./pages/**/*.tsx'));
        // Toutes les pages sauf connexion/inscription reçoivent le menu en layout persistant (voir layouts/nav-layout.tsx).
        if (!name.startsWith('auth/')) {
            page.default.layout ??= (content) => <NavLayout>{content}</NavLayout>;
        }
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    // Barre de chargement entre deux pages, à la couleur de l'appli
    progress: {
        color: '#e33d81',
    },
});

// Thème clair / sombre choisi dans Paramètres → Apparence
initializeTheme();

// PWA : enregistre le service worker (/sw.js) ; il se met à jour tout seul après chaque déploiement
registerSW({ immediate: true });
