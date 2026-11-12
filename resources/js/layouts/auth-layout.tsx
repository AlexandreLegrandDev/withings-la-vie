import type { ReactNode } from 'react';

/** Cadre des pages de connexion / inscription : largeur téléphone, sans le menu du bas. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-background text-foreground min-h-svh">
            <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">{children}</div>
        </div>
    );
}
