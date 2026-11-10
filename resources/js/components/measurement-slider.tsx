import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';

type MeasurementSliderProps = {
    id: string;
    label: string;
    value: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    error?: string;
    onChange: (value: string) => void;
};

export function MeasurementSlider({ id, label, value, min, max, step, unit, error, onChange }: MeasurementSliderProps) {
    const progress = ((Number(value) - min) / (max - min)) * 100;
    const formattedValue = `${Number(value).toLocaleString('fr-FR')} ${unit}`;

    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className="pl-4">{label}</Label>
            <div className="relative pt-8">
                <output
                    htmlFor={id}
                    className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 text-sm font-semibold text-brand tabular-nums"
                    style={{ left: `calc(${progress}% + ${12 - progress * 0.24}px)` }}
                >
                    {formattedValue}
                </output>
                <input
                    id={id}
                    name={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    aria-valuetext={formattedValue}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className="measurement-slider block h-8 w-full cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="flex justify-between text-xs text-neutral-500" aria-hidden="true">
                    <span>{min} {unit}</span>
                    <span>{max} {unit}</span>
                </div>
            </div>
            <InputError id={`${id}-error`} message={error} className="pl-4" />
        </div>
    );
}
