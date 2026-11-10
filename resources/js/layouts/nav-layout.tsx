import { BottomNav } from '@/components/bottom-nav';
import type { ReactNode } from 'react';

/**
 * Layout persistant : Inertia le garde à l'écran d'une page à l'autre et ne remplace que `children`.
 * Le menu n'est donc pas recréé à chaque navigation, ce qui permet à sa bulle de glisser.
 * Il est appliqué automatiquement à toutes les pages dans app.tsx (sauf les pages auth/).
 */
export default function NavLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
}
