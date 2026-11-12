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

/** Cadre commun des pages : contenu sur la largeur du téléphone. Le menu, lui, est dans nav-layout.tsx. */
export default function MobileLayout({ title, backHref, className, children }: MobileLayoutProps) {
    return (
        <div className="bg-background text-foreground min-h-screen">
            <Head title={title} />
            {/* pb-32 : laisse la place au menu fixé en bas pour ne pas cacher le contenu */}
            {/* stagger : les blocs de la page apparaissent l'un après l'autre (resources/css/app.css) */}
            <main className={cn('stagger mx-auto max-w-md px-4 pt-8 pb-32', className)}>
                {backHref && (
                    <header className="mb-6 flex items-center gap-2">
                        <Link
                            href={backHref}
                            aria-label="Retour"
                            className="border-border flex size-11 shrink-0 items-center justify-center rounded-full border"
                        >
                            <ChevronLeft className="size-5" />
                        </Link>
                        <h1 className="text-[clamp(1.6rem,7.5vw,2rem)] leading-tight font-semibold tracking-tight">{title}</h1>
                    </header>
                )}
                {children}
            </main>
        </div>
    );
}
