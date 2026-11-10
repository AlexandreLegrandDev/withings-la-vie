import MobileLayout from '@/layouts/mobile-layout';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function Today() {
    // L'utilisateur connecté est partagé avec toutes les pages (HandleInertiaRequests.php) ; « name » contient le prénom
    const { auth } = usePage<SharedData>().props;

    return (
        <MobileLayout title="Aujourd'hui">
            <h1 className="text-3xl font-bold">
                Salut <span className="font-display font-normal text-brand">{auth.user.name}</span>
            </h1>
        </MobileLayout>
    );
}
