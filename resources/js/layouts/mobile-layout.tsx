import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface MobileLayoutProps {
    /** Titre de l'onglet du navigateur. */
    title: string;
    /** Si renseigné, affiche une flèche retour et le titre en haut (pour les sous-pages comme les réglages). */
    backHref?: string;
    /** Classes en plus sur le contenu (ex. réduire la marge du haut sur l'accueil). */
    className?: string;
    children?: ReactNode;
}

/** Cadre commun des pages : fond blanc, contenu sur la largeur du téléphone. Le menu, lui, est dans nav-layout.tsx. */
export default function MobileLayout({ title, backHref, className, children }: MobileLayoutProps) {
    return (
        <div className="min-h-screen bg-white text-neutral-900">
            <Head title={title} />
            {/* pb-32 : laisse la place au menu fixé en bas pour ne pas cacher le contenu */}
            <main className={cn('mx-auto max-w-md px-4 pt-8 pb-32', className)}>
                {backHref && (
                    <header className="mb-6 flex items-center gap-2">
                        <Link href={backHref} aria-label="Retour" className="-ml-2 flex size-11 items-center justify-center rounded-full">
                            <ChevronLeft className="size-6" />
                        </Link>
                        <h1 className="text-3xl font-bold">{title}</h1>
                    </header>
                )}
                {children}
            </main>
        </div>
    );
}
