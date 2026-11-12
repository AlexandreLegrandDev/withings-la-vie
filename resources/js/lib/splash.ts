/** Durée minimale de l'écran de chargement (resources/views/partials/splash.blade.php), en ms. */
const MIN_DURATION = 2500;

/**
 * Retire l'écran de chargement une fois l'appli prête, mais pas avant 2,5 s depuis l'ouverture de la page
 * (performance.now() compte depuis le début du chargement). Il disparaît en fondu.
 */
export function hideSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    const remaining = Math.max(0, MIN_DURATION - performance.now());
    window.setTimeout(() => {
        splash.classList.add('is-leaving');
        // Retiré après le fondu (ou tout de suite si les transitions sont coupées)
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
        window.setTimeout(() => splash.remove(), 600);
    }, remaining);
}
