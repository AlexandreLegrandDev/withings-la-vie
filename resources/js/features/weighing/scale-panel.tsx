import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ScalePanelProps {
    /** Poids brut mesuré par la balance (g). */
    rawWeight: number;
    /** Valeur de la tare (g). */
    tare: number;
    onRawWeightChange: (grams: number) => void;
    onTare: () => void;
}

/** Affiche le poids net. La saisie manuelle simule la balance en attendant la vraie connexion. */
export function ScalePanel({ rawWeight, tare, onRawWeightChange, onTare }: ScalePanelProps) {
    const net = Math.max(0, rawWeight - tare);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center text-6xl font-bold tabular-nums">
                    {net} <span className="text-2xl font-normal">g</span>
                </div>
                {tare > 0 && <p className="text-muted-foreground text-center text-sm">Tare : {tare} g</p>}
                <div className="flex gap-2">
                    <Input
                        type="number"
                        min={0}
                        value={rawWeight}
                        onChange={(e) => onRawWeightChange(Number(e.target.value) || 0)}
                        aria-label="Simuler le poids"
                    />
                    <Button variant="outline" onClick={onTare}>
                        Tare
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
