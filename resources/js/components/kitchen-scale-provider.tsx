import { KitchenScaleContext } from '@/contexts/kitchen-scale-context';
import { useState, type ReactNode } from 'react';

/** Conservé entre les pages, même quand Inertia restaure une page depuis son cache. */
export function KitchenScaleProvider({ initialConnected, children }: { initialConnected: boolean; children: ReactNode }) {
    const [connected, setConnected] = useState(initialConnected);

    return <KitchenScaleContext.Provider value={{ connected, setConnected }}>{children}</KitchenScaleContext.Provider>;
}
