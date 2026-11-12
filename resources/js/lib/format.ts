/** Nombre à la française : 7,4 / 520 / 31 (1 décimale max par défaut). */
export const formatNumber = (value: number | string, maximumFractionDigits = 1) => Number(value).toLocaleString('fr-FR', { maximumFractionDigits });

/** Date AAAA-MM-JJ envoyée par le serveur → Date à midi, pour qu'aucun décalage de fuseau ne fasse afficher la veille. */
export const parseDay = (date: string) => new Date(`${date}T12:00:00`);

/** « mardi 10 novembre » */
export const formatLongDay = (date: string) => parseDay(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Date et heure ISO envoyées par le serveur → « 12 nov. », toujours à l'heure de Paris. */
export const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

/** « 1 aliment pesé » / « 3 aliments pesés » */
export const plural = (count: number, singular: string, pluralForm = `${singular}s`) => (count > 1 ? pluralForm : singular);

/** Date du jour à Paris, AAAA-MM-JJ (pour le max des champs date). */
export const todayInParis = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
