import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Ingredient } from '../nutrition/types';

interface IngredientPickerProps {
    ingredients: Ingredient[];
    selectedId: number | null;
    onSelect: (ingredient: Ingredient) => void;
}

export function IngredientPicker({ ingredients, selectedId, onSelect }: IngredientPickerProps) {
    const [search, setSearch] = useState('');
    const filtered = ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Ingrédient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <ul className="max-h-64 space-y-1 overflow-y-auto">
                    {filtered.map((ingredient) => (
                        <li key={ingredient.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(ingredient)}
                                className={cn(
                                    'hover:bg-accent w-full rounded-md px-3 py-2 text-left',
                                    ingredient.id === selectedId && 'bg-accent font-medium',
                                )}
                            >
                                {ingredient.name}
                                <span className="text-muted-foreground ml-2 text-sm">{ingredient.per100g.kcal} kcal/100 g</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
