{{--
    Écran de chargement affiché à chaque lancement de l'appli (chargement complet de la page).
    Il est en HTML/CSS pur, directement dans la page : il s'affiche avant même que React démarre.
    Il reste au moins 2,5 s, puis resources/js/lib/splash.ts le fait disparaître en fondu.
--}}
<style>
    #splash {
        --splash-bg-1: #fff1f6;
        --splash-bg-2: #ffd9e8;
        --splash-ink: #1a1a1f;
        --splash-soft: #a6255c;
        --splash-track: rgba(227, 61, 129, 0.18);
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: env(safe-area-inset-top) 24px env(safe-area-inset-bottom);
        background: radial-gradient(120% 80% at 50% 35%, var(--splash-bg-1) 0%, var(--splash-bg-2) 70%);
        color: var(--splash-ink);
        font-family: 'Figtree Variable', ui-sans-serif, system-ui, sans-serif;
        transition: opacity 450ms ease, transform 450ms ease;
    }

    .dark #splash .splash-dot {
        opacity: 0.22;
    }

    .dark #splash {
        --splash-bg-1: #2a1520;
        --splash-bg-2: #121216;
        --splash-ink: #f2f2f5;
        --splash-soft: #ff9cc6;
        --splash-track: rgba(255, 156, 198, 0.2);
    }

    #splash.is-leaving {
        opacity: 0;
        transform: scale(1.04);
        pointer-events: none;
    }

    /* Formes décoratives qui flottent dans le fond */
    #splash .splash-dot {
        position: absolute;
        border-radius: 999px;
        opacity: 0.9;
        animation: splash-drift 6s ease-in-out infinite alternate;
    }

    #splash .splash-star {
        position: absolute;
        width: 22px;
        height: 22px;
        fill: #ffd24d;
        animation: splash-twinkle 1.6s ease-in-out infinite;
    }

    /* Scène centrale : deux blobs qui se chevauchent, une mascotte sur chacun */
    #splash .splash-stage {
        position: relative;
        width: min(86vw, 360px);
        aspect-ratio: 1 / 0.82;
    }

    #splash .splash-buddy {
        position: absolute;
        width: 58%;
        aspect-ratio: 511 / 441;
        animation: splash-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }

    #splash .splash-buddy--tofu {
        left: 0;
        bottom: 0;
        --tilt: -7deg;
        animation-delay: 120ms;
    }

    #splash .splash-buddy--bacon {
        right: 0;
        top: 0;
        --tilt: 8deg;
        animation-delay: 320ms;
    }

    #splash .splash-blob {
        position: absolute;
        inset: 0;
        transform: rotate(var(--tilt));
        -webkit-mask: url(/image/blob-haikei.svg) center / 100% 100% no-repeat;
        mask: url(/image/blob-haikei.svg) center / 100% 100% no-repeat;
    }

    #splash .splash-buddy--tofu .splash-blob {
        background: #ffe680;
    }

    #splash .splash-buddy--bacon .splash-blob {
        background: #e33d81;
    }

    /* Ombre douce sous chaque blob */
    #splash .splash-buddy::before {
        content: '';
        position: absolute;
        left: 18%;
        right: 18%;
        bottom: -6%;
        height: 12%;
        border-radius: 50%;
        background: rgba(166, 37, 92, 0.16);
        filter: blur(6px);
    }

    .dark #splash .splash-buddy::before {
        background: rgba(0, 0, 0, 0.45);
    }

    #splash .splash-mascot {
        position: absolute;
        left: -14%;
        top: -34%;
        width: 128%;
        height: 140%;
        object-fit: contain;
        filter: drop-shadow(0 10px 10px rgba(26, 26, 31, 0.18));
        animation: splash-float 2.4s ease-in-out infinite;
    }

    #splash .splash-buddy--bacon .splash-mascot {
        animation-delay: -1.2s;
    }

    /* Petit cœur entre les deux mascottes */
    #splash .splash-heart {
        position: absolute;
        left: 38%;
        top: 22%;
        width: 38px;
        height: 38px;
        fill: #f57aae;
        transform: translate(-50%, -50%);
        animation: splash-beat 1.2s ease-in-out 900ms infinite backwards;
    }

    #splash .splash-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 18px;
        animation: splash-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 500ms backwards;
    }

    #splash .splash-title img {
        width: 52px;
        height: 52px;
    }

    #splash .splash-title span {
        font-family: 'Bagel Fat One', ui-rounded, sans-serif;
        font-size: clamp(2.4rem, 12vw, 3.2rem);
        line-height: 1;
        color: #e33d81;
        text-shadow: 0 4px 0 rgba(166, 37, 92, 0.25);
    }

    #splash .splash-tagline {
        margin-top: 10px;
        font-size: 1rem;
        font-weight: 600;
        color: var(--splash-soft);
        animation: splash-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 650ms backwards;
    }

    /* Barre de chargement : se remplit en 2,5 s, la durée de l'écran */
    #splash .splash-bar {
        width: min(56vw, 220px);
        height: 8px;
        margin-top: 28px;
        border-radius: 999px;
        background: var(--splash-track);
        overflow: hidden;
        animation: splash-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 750ms backwards;
    }

    #splash .splash-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #f57aae, #e33d81);
        transform-origin: left;
        animation: splash-fill 2.5s cubic-bezier(0.45, 0, 0.25, 1) both;
    }

    #splash .splash-credit {
        position: absolute;
        bottom: calc(28px + env(safe-area-inset-bottom));
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--splash-soft);
        opacity: 0.8;
        animation: splash-rise 600ms ease 900ms backwards;
    }

    @keyframes splash-pop {
        from {
            opacity: 0;
            transform: scale(0.6) translateY(30px);
        }
    }

    @keyframes splash-float {
        50% {
            transform: translateY(-9px) rotate(-2deg);
        }
    }

    @keyframes splash-beat {
        from {
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.25);
        }
    }

    @keyframes splash-rise {
        from {
            opacity: 0;
            transform: translateY(14px);
        }
    }

    @keyframes splash-fill {
        from {
            transform: scaleX(0);
        }
    }

    @keyframes splash-drift {
        to {
            transform: translate(12px, -16px);
        }
    }

    @keyframes splash-twinkle {
        50% {
            transform: scale(0.6) rotate(20deg);
            opacity: 0.5;
        }
    }

    /* Moins de mouvements demandés : on garde l'écran et la barre, sans rebonds ni flottement */
    @media (prefers-reduced-motion: reduce) {
        #splash *,
        #splash .splash-mascot {
            animation-name: none !important;
        }

        #splash .splash-bar span {
            animation-name: splash-fill !important;
        }
    }
</style>

<div id="splash" role="status" aria-label="Chargement de Veggings">
    {{-- Fond : pastilles colorées et étoiles --}}
    <span aria-hidden="true" class="splash-dot" style="width:150px;height:150px;top:-40px;left:-50px;background:#d9ecfa"></span>
    <span aria-hidden="true" class="splash-dot" style="width:90px;height:90px;top:12%;right:-24px;background:#fff1bc;animation-delay:-2s"></span>
    <span aria-hidden="true" class="splash-dot" style="width:120px;height:120px;bottom:8%;left:-40px;background:#e0f5e9;animation-delay:-4s"></span>
    <span aria-hidden="true" class="splash-dot" style="width:180px;height:180px;bottom:-70px;right:-50px;background:#eee5fa;animation-delay:-1s"></span>
    <span aria-hidden="true" class="splash-dot" style="width:18px;height:18px;top:24%;left:18%;background:#5dc28c"></span>
    <span aria-hidden="true" class="splash-dot" style="width:14px;height:14px;top:30%;right:16%;background:#f57aae;animation-delay:-3s"></span>
    <svg aria-hidden="true" class="splash-star" style="top:16%;left:26%" viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" /></svg>
    <svg aria-hidden="true" class="splash-star" style="top:20%;right:24%;width:16px;height:16px;animation-delay:-.6s" viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" /></svg>
    <svg aria-hidden="true" class="splash-star" style="bottom:24%;right:14%;width:26px;height:26px;animation-delay:-1.1s" viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" /></svg>
    <svg aria-hidden="true" class="splash-star" style="bottom:30%;left:12%;width:14px;height:14px;animation-delay:-.3s" viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" /></svg>

    <div class="splash-stage" aria-hidden="true">
        <div class="splash-buddy splash-buddy--tofu">
            <div class="splash-blob"></div>
            <img class="splash-mascot" src="/image/Mascotte%20tofu%20fraise.svg" alt="">
        </div>
        <div class="splash-buddy splash-buddy--bacon">
            <div class="splash-blob"></div>
            <img class="splash-mascot" src="/image/Bacon.svg" alt="">
        </div>
        <svg class="splash-heart" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.5 1.2 4.3 2.4.8-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z" /></svg>
    </div>

    <div class="splash-title">
        <img src="/image/Logo%20transparent.png" alt="" aria-hidden="true">
        <span>Veggings</span>
    </div>
    <p class="splash-tagline">Ton assiette végé, bien équilibrée</p>
    <div class="splash-bar" aria-hidden="true"><span></span></div>

    <p class="splash-credit">Withings × La Vie</p>

    {{-- Filet de sécurité : si l'appli ne démarre pas, l'écran disparaît quand même --}}
    <script>
        setTimeout(function () {
            var splash = document.getElementById('splash');
            if (splash) splash.remove();
        }, 8000);
    </script>
</div>
