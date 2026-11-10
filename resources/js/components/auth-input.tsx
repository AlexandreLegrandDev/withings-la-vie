import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

// Champ arrondi gris clair, bordure rose quand on écrit dedans (maquette png/img_1.png).
// text-base (16 px) : en dessous, Safari sur iPhone zoome automatiquement sur le champ.
const authInputClass =
    'h-14 rounded-full border-2 border-transparent bg-neutral-100 px-5 text-base md:text-base placeholder:text-neutral-400 focus-visible:border-brand focus-visible:ring-0 focus-visible:ring-offset-0';

export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
    return <Input className={cn(authInputClass, className)} {...props} />;
}

/** Champ mot de passe avec un œil pour afficher / masquer ce qu'on tape. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, 'type'>) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <AuthInput type={visible ? 'text' : 'password'} className={cn('pr-14', className)} {...props} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute inset-y-0 right-1 flex w-12 items-center justify-center text-neutral-400"
            >
                {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
        </div>
    );
}
