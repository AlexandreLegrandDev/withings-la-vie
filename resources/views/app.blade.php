<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        {{-- viewport-fit=cover : occupe tout l'écran des téléphones à encoche --}}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        {{-- Couleur de la barre du navigateur mobile (mise à jour selon le thème par hooks/use-appearance.tsx) --}}
        <meta name="theme-color" content="#ffffff">

        {{-- Thème sombre appliqué avant l'affichage, pour éviter un flash blanc (même logique que hooks/use-appearance.tsx) --}}
        <script>
            (function () {
                try {
                    var appearance = localStorage.getItem('appearance') || 'light';
                    var dark = appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    document.documentElement.classList.toggle('dark', dark);
                    if (dark) document.querySelector('meta[name="theme-color"]').setAttribute('content', '#121216');
                } catch (e) {}
            })();
        </script>

        {{-- PWA : manifest (généré par vite-plugin-pwa au build) et icônes --}}
        <link rel="manifest" href="/build/manifest.webmanifest">
        <link rel="icon" href="/favicon.ico" sizes="48x48">
        <link rel="icon" href="/icons/pwa-192x192.png" type="image/png" sizes="192x192">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="Veggings">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">

        <title inertia>{{ config('app.name', 'Veggings') }}</title>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="bg-background text-foreground font-sans antialiased">
        @include('partials.splash')
        @inertia
    </body>
</html>
