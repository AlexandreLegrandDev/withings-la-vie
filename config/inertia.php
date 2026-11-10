<?php

// Surcharge de la config du paquet inertia-laravel (le reste garde ses valeurs par défaut).
// Nos pages sont dans resources/js/pages (minuscule) alors qu'Inertia cherche par défaut resources/js/Pages :
// sous Windows la casse est ignorée, mais en CI (Linux) les tests ne trouvaient pas les pages.

$pages = [
    'page_paths' => [resource_path('js/pages')],
    'page_extensions' => ['js', 'jsx', 'svelte', 'ts', 'tsx', 'vue'],
];

return [
    ...$pages,

    'testing' => [
        // Les tests vérifient que la page React demandée par le contrôleur existe bien sur le disque
        'ensure_pages_exist' => true,
        ...$pages,
    ],
];
