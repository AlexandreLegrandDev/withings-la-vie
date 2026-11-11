import { createContext, useContext } from 'react';

export const KitchenScaleContext = createContext<{
    connected: boolean;
    setConnected: (connected: boolean) => void;
} | null>(null);

export function useKitchenScale() {
    const context = useContext(KitchenScaleContext);
    if (!context) throw new Error('KitchenScale must be rendered inside KitchenScaleProvider');
    return context;
}
