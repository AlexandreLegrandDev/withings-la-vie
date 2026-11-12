<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /** Gabarit chargé à la première visite (resources/views/app.blade.php). */
    protected $rootView = 'app';

    /**
     * Données partagées avec toutes les pages.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }
}
