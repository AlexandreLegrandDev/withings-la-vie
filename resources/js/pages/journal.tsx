import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Journal() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Journal', href: '/journal' }]}>
            <Head title="Journal" />
            <div className="p-4">
                <p className="text-muted-foreground">Le journal des repas pesés arrivera ici.</p>
            </div>
        </AppLayout>
    );
}
