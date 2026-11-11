/** Valeurs provisoires pour une portion de démonstration ; à remplacer par l'API aliments. */
const demoNutrients = [
    { label: 'Protéines', value: '14,7 g', color: 'bg-[#ffd9e8] text-[#a6255c]' },
    { label: 'Calcium', value: '196 mg', color: 'bg-[#fff1bc] text-[#756020]' },
    { label: 'Fer', value: '2,5 mg', color: 'bg-[#d9ecfa] text-[#315872]' },
    { label: 'Vitamine B12', value: '0,4 µg', color: 'bg-[#e0f5e9] text-[#287354]' },
    { label: 'Zinc', value: '1,2 mg', color: 'bg-[#eee5fa] text-[#70518b]' },
];

export function IngredientNutrients() {
    return (
        <section aria-label="Apports nutritionnels de démonstration">
            <dl className="flex flex-wrap gap-2">
                {demoNutrients.map(({ label, value, color }) => (
                    <div key={label} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs ${color}`}>
                        <dt>{label}</dt>
                        <dd className="font-mono">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-2 text-[10px] text-neutral-500">Valeurs de démonstration, en attendant le catalogue des aliments.</p>
        </section>
    );
}
