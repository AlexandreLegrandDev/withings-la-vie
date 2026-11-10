import { RecipeCard, type Recipe } from '@/features/recipes/recipe-card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Recipes({ recipes }: { recipes: Recipe[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Recettes', href: '/recettes' }]}>
            <Head title="Recettes" />
            <div className="grid gap-4 p-4 md:grid-cols-3">
                {recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
        </AppLayout>
    );
}
