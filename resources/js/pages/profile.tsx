import MobileLayout from '@/layouts/mobile-layout';
import { Link } from '@inertiajs/react';

export default function Profile() {
    return (
        <MobileLayout title="Profil">
            {/* Provisoire, pour tester : method="post" car la déconnexion est une requête POST côté Laravel */}
            <Link href={route('logout')} method="post" as="button" className="bg-night h-14 w-full rounded-full font-medium text-white">
                Se déconnecter
            </Link>
        </MobileLayout>
    );
}
