interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

/** Cadre des pages de connexion / inscription : fond blanc, largeur téléphone. */
export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="min-h-svh bg-white text-neutral-900">
            <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                {title && (
                    <div className="mb-8 space-y-2">
                        <h1 className="text-3xl font-semibold">{title}</h1>
                        {description && <p className="text-sm text-neutral-500">{description}</p>}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
