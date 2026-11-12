import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import SettingsLayout, { SettingsCard } from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { Check, Moon, Smartphone, Sun, type LucideIcon } from 'lucide-react';

const options: { value: Appearance; label: string; description: string; icon: LucideIcon }[] = [
    { value: 'light', label: 'Clair', description: 'Fond blanc, couleurs pastel', icon: Sun },
    { value: 'dark', label: 'Sombre', description: 'Plus doux pour les yeux le soir', icon: Moon },
    { value: 'system', label: 'Comme mon téléphone', description: 'Suit le réglage clair / sombre du téléphone', icon: Smartphone },
];

/** Paramètres → Apparence : thème clair, sombre, ou celui du téléphone. Le choix est gardé sur cet appareil. */
export default function AppearanceSettings() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <SettingsLayout title="Apparence">
            <SettingsCard title="Thème" description="Le thème sombre garde les mêmes couleurs que l’appli, en version foncée.">
                <div className="grid gap-2" role="radiogroup" aria-label="Thème de l'appli">
                    {options.map(({ value, label, description, icon: Icon }) => {
                        const selected = appearance === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => updateAppearance(value)}
                                className={cn(
                                    'focus-visible:outline-brand flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-2',
                                    selected ? 'border-brand bg-rose-soft' : 'border-border hover:bg-muted',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-11 shrink-0 items-center justify-center rounded-full',
                                        value === 'dark' ? 'bg-night text-white' : value === 'light' ? 'bg-sun text-sun-ink' : 'bg-sky text-sky-ink',
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold">{label}</span>
                                    <span className="text-muted-foreground block text-sm">{description}</span>
                                </span>
                                {selected && <Check className="text-brand size-5 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </SettingsCard>
        </SettingsLayout>
    );
}
