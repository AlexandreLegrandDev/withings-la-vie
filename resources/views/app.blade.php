<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        {{-- viewport-fit=cover : occupe tout l'écran des téléphones à encoche --}}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        {{-- Couleur de la barre du navigateur mobile --}}
        <meta name="theme-color" content="#ffffff">

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
    <body class="bg-white font-sans antialiased">
        @inertia
    </body>
</html>
