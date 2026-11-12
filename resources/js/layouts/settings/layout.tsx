import MobileLayout from '@/layouts/mobile-layout';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

const tabs = [
    { label: 'Compte', href: '/settings/profile' },
    { label: 'Mot de passe', href: '/settings/password' },
    { label: 'Apparence', href: '/settings/appearance' },
];

/** Cadre des pages Paramètres : retour vers le profil, titre, onglets (même bascule que Semaine / Mois du suivi). */
export default function SettingsLayout({ title, children }: { title: string; children: ReactNode }) {
    const { url } = usePage();

    return (
        <MobileLayout title={`Paramètres · ${title}`}>
            <header className="flex items-center gap-3">
                <Link
                    href={route('profile')}
                    aria-label="Retour au profil"
                    className="border-border flex size-11 shrink-0 items-center justify-center rounded-full border"
                >
                    <ChevronLeft className="size-5" />
                </Link>
                <h1 className="text-[clamp(1.6rem,7.5vw,2rem)] leading-tight font-semibold tracking-tight">
                    Tes <span className="font-display text-periwinkle font-normal">paramètres</span>
                </h1>
            </header>

            <nav className="bg-muted mt-5 grid grid-cols-3 gap-1 rounded-full p-1" aria-label="Rubriques des paramètres">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        prefetch
                        replace
                        aria-current={url.startsWith(tab.href) ? 'page' : undefined}
                        className={cn(
                            'rounded-full py-2.5 text-center text-sm font-medium transition-colors',
                            url.startsWith(tab.href) ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>

            <div className="stagger mt-6 flex flex-col gap-4">{children}</div>
        </MobileLayout>
    );
}

/** Bloc d'une page Paramètres : titre, phrase d'explication et contenu, sur une carte arrondie. */
export function SettingsCard({
    title,
    description,
    className,
    children,
}: {
    title: string;
    description?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={cn('border-border rounded-3xl border p-5', className)}>
            <h2 className="text-lg font-bold">{title}</h2>
            {description && <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>}
            <div className="mt-5">{children}</div>
        </section>
    );
}

/** Message « Enregistré » qui apparaît quelques secondes après une sauvegarde réussie. */
export function SavedMessage({ show }: { show: boolean }) {
    return (
        <p
            aria-live="polite"
            className={cn('text-mint-ink text-center text-sm font-medium transition-opacity duration-300', show ? 'opacity-100' : 'opacity-0')}
        >
            {show && 'Enregistré ✓'}
        </p>
    );
}
