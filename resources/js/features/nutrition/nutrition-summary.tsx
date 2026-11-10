import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Nutrition } from './types';

const rows: { key: keyof Nutrition; label: string; unit: string }[] = [
    { key: 'kcal', label: 'Énergie', unit: 'kcal' },
    { key: 'proteins', label: 'Protéines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'fats', label: 'Lipides', unit: 'g' },
];

export function NutritionSummary({ nutrition, title = 'Bilan' }: { nutrition: Nutrition; title?: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {rows.map(({ key, label, unit }) => (
                    <div key={key}>
                        <div className="text-muted-foreground text-sm">{label}</div>
                        <div className="text-2xl font-semibold">
                            {nutrition[key]} <span className="text-base font-normal">{unit}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
