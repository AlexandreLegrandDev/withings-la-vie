import MobileLayout from '@/layouts/mobile-layout';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

const tabs = [
    { label: 'Profil', href: '/settings/profile' },
    { label: 'Mot de passe', href: '/settings/password' },
    { label: 'Apparence', href: '/settings/appearance' },
];

/** Cadre des pages de réglages : retour vers le profil + onglets en haut. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();

    return (
        <MobileLayout title="Réglages" backHref="/profil">
            <nav className="bg-muted mb-8 flex gap-1 rounded-full p-1">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        prefetch
                        className={cn(
                            'flex-1 rounded-full py-2.5 text-center text-sm font-medium transition-colors',
                            url.startsWith(tab.href) ? 'bg-background shadow-sm' : 'text-muted-foreground',
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>
            <div className="space-y-10">{children}</div>
        </MobileLayout>
    );
}
