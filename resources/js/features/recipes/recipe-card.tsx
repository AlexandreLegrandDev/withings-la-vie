import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface Recipe {
    id: number;
    title: string;
    description: string;
    kcal: number;
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{recipe.title}</CardTitle>
                <CardDescription>{recipe.kcal} kcal</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">{recipe.description}</CardContent>
        </Card>
    );
}
