import { cn } from '@/lib/utils';
import { useState } from 'react';

// Forme du fond : le SVG sert de masque (il découpe la forme), la couleur vient de la classe bg-… passée en color.
// Ainsi le même fichier donne un blob rose sur la connexion et jaune sur l'inscription.
const blob = 'url(/image/blob-haikei.svg)';

interface MascotProps {
    /** Image de la mascotte, dans public/image/ (Mascotte tofu fraise.svg, Bacon.svg). */
    src: string;
    /** Description de la mascotte pour les lecteurs d'écran. */
    alt?: string;
    /** Couleur du blob (classe Tailwind, ex. "bg-brand"). */
    color: string;
    /** Taille / placement (classes Tailwind, ex. "w-[38%] shrink-0"). */
    className?: string;
}

/** Blob de couleur avec une mascotte par-dessus. Tant que l'image n'existe pas, seul le blob s'affiche. */
export function Mascot({ src, alt = '', color, className }: MascotProps) {
    const [missing, setMissing] = useState(false);

    return (
        // aspect-[511/441] : mêmes proportions que le blob, pour qu'il ne soit pas déformé
        <div className={cn('relative aspect-[511/441]', className)}>
            <div
                className={cn('absolute inset-0', color)}
                style={{ maskImage: blob, WebkitMaskImage: blob, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}
            />
            {!missing && <img src={src} alt={alt} className="relative size-full object-contain" onError={() => setMissing(true)} />}
        </div>
    );
}
