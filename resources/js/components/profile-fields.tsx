import InputError from '@/components/input-error';
import { dietOptions, sexLabels } from '@/lib/profile';
import { cn } from '@/lib/utils';

/** Choix du sexe en deux boutons (Femme / Homme), utilisé à l'inscription et dans les paramètres. */
export function SexField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
    return (
        <fieldset className="grid gap-2">
            <legend className="mb-2 pl-4 text-sm font-medium">Sexe</legend>
            <div className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1">
                {Object.entries(sexLabels).map(([option, label]) => (
                    <label key={option} className="cursor-pointer">
                        <input
                            type="radio"
                            name="sex"
                            value={option}
                            checked={value === option}
                            onChange={() => onChange(option)}
                            required
                            className="peer sr-only"
                        />
                        <span className="peer-checked:bg-card peer-checked:text-foreground text-muted-foreground peer-focus-visible:outline-brand flex h-12 items-center justify-center rounded-full text-base font-medium transition-colors peer-checked:shadow-sm peer-focus-visible:outline-2">
                            {label}
                        </span>
                    </label>
                ))}
            </div>
            <InputError message={error} className="pl-4" />
        </fieldset>
    );
}

/** Choix du régime (cartes Végétarien / En transition). */
export function DietField({
    value,
    onChange,
    error,
    layout = 'stack',
}: {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    /** « stack » : grandes cartes centrées (inscription) ; « row » : côte à côte (paramètres). */
    layout?: 'stack' | 'row';
}) {
    return (
        <div className={cn('grid gap-3', layout === 'stack' ? 'justify-items-center gap-6' : 'grid-cols-2')}>
            {dietOptions.map((option) => (
                <label key={option.value} className={cn('relative cursor-pointer', layout === 'row' && 'flex')}>
                    <input
                        type="radio"
                        name="diet_status"
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        aria-invalid={Boolean(error)}
                        className="peer sr-only"
                    />
                    <span
                        className={cn(
                            'peer-checked:ring-brand peer-focus-visible:outline-brand ring-offset-background flex flex-col items-center justify-center text-center ring-offset-4 transition-shadow peer-checked:ring-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-8 peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
                            layout === 'stack' ? 'min-h-[185px] w-[185px] gap-5 rounded-[30px] px-5 py-7' : 'w-full gap-2 rounded-3xl px-3 py-4',
                            option.background,
                        )}
                    >
                        <span className={cn('font-display', layout === 'stack' ? 'text-xl' : 'text-lg')}>{option.title}</span>
                        <span className="text-subtle text-sm leading-tight">{option.description}</span>
                    </span>
                </label>
            ))}
            <InputError message={error} className={layout === 'row' ? 'col-span-2' : undefined} />
        </div>
    );
}
