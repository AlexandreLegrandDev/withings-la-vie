<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Suggère des aliments du catalogue qui comblent les nutriments les moins couverts de la journée.
 *
 * Score d'un aliment (portion de 100 g) = somme, sur les nutriments en retard, de
 * « retard du nutriment » × « part du besoin restant que la portion couvre ».
 * Les produits La Vie sont légèrement favorisés, et l'un d'eux est toujours proposé s'il aide.
 */
class FoodSuggester
{
    public const PORTION_G = 100;

    /** Viande, poisson et fruits de mer : exclus des suggestions d'une appli végétarienne. */
    private const NOT_VEGETARIAN = '/\b(boeuf|veau|porc|porcelet|poulet|poule|coq|dinde|dindonneau|canard|oie|agneau|mouton|chevreau|lapin|lievre|cheval|gibier|chevreuil|sanglier|caille|pintade|pigeon|faisan|autruche|volaille|viande|viandes|steak|bifteck|entrecote|escalope|jambon|lardons?|lard|bacon|saucisses?|saucisson|chorizo|salami|merguez|chipolata|cervelas|mortadelle|rosette|andouillette|andouille|boudin|rillettes|foie|terrine|galantine|tripes|museau|langue|rognons?|cervelle|gesiers?|magret|nuggets?|cordon bleu|kebab|hamburger|cheeseburger|hot[- ]dog|bolognaise|carbonara|cassoulet|paella|poissons?|thon|saumon|cabillaud|morue|colin|lieu|merlu|merlan|sole|limande|plie|turbot|bar|loup|dorade|daurade|sardines?|maquereau|hareng|anchois|truite|carpe|brochet|perche|sandre|anguille|espadon|raie|rouget|lotte|baudroie|fletan|tilapia|panga|eglefin|haddock|congre|mulet|surimi|crevettes?|gambas|langoustines?|langouste|homard|crabe|tourteau|araignee|ecrevisses?|moules?|huitres?|saint-jacques|petoncles?|bulots?|bigorneaux?|palourdes?|calamars?|calmars?|encornets?|seiche|poulpe|oursin|escargots?|grenouille|tarama|caviar|crustaces?|mollusques?|fruits de mer|gelatine|consomme)\b/';

    /** Produits « végétal / soja / tofu… » : gardés même si leur nom contient « jambon », « steak »… */
    private const PLANT_BASED = '/\b(vegetal|vegetale|vegetales|vegetaux|vegetarien|vegetarienne|vegan|vegetalien|vegetalienne|soja|tofu|seitan|tempeh)\b/';

    /** Ingrédients qu'on ne mange pas par 100 g (épices, condiments, poudres…) : ils fausseraient le classement. */
    private const NOT_A_PORTION = '/\b(epices?|cumin|curcuma|paprika|curry|cannelle|muscade|gingembre|poivre|piment|laurier|thym|romarin|origan|basilic|persil|sauge|fenugrec|coriandre|cardamome|girofle|anis|fenouil|safran|herbes|sel|levure|bicarbonate|agar|complement|aromes?|bouillon|vinaigre|moutarde|ketchup|mayonnaise|sauces?|cacao|chocolat|spiruline|algues?|nori|wakame|kombu|dulse|the|cafe|infusion|infantile|nourrissons?|bebe|croissance|edulcorant|poudre|seche|seches|sechee|sechees|deshydrate|deshydratee)\b/';

    /** Libellé court de chaque nutriment dans « +14 g prot. · +3 mg fer ». */
    private const SHORT_LABELS = ['protein' => 'prot.', 'iron' => 'fer', 'b12' => 'B12', 'calcium' => 'calcium', 'zinc' => 'zinc'];

    /** Clé du nutriment (DailyIntake::NUTRIENTS) => champ du catalogue. */
    private const CATALOGUE_FIELDS = ['protein' => 'protein_g', 'iron' => 'iron_mg', 'b12' => 'b12_ug', 'calcium' => 'calcium_mg', 'zinc' => 'zinc_mg'];

    public function __construct(private FoodCatalogue $catalogue, private DailyIntake $dailyIntake) {}

    /**
     * @return list<array{key: string, name: string, weight_g: int, benefits: string, badge: string|null}>
     */
    public function forDay(User $user, string $date, int $limit = 3): array
    {
        return $this->forIntake($this->dailyIntake->forUser($user, $date), $limit);
    }

    /**
     * Suggestions à partir d'un bilan du jour déjà calculé (DailyIntake::forUser).
     *
     * @return list<array{key: string, name: string, weight_g: int, benefits: string, badge: string|null}>
     */
    public function forIntake(array $intake, int $limit = 3): array
    {
        // Nutriments en retard : ce qu'il reste à manger, et le poids du retard (1 = rien mangé)
        $gaps = collect($intake['nutrients'])
            ->where('percent', '<', 100)
            ->mapWithKeys(fn ($n) => [$n['key'] => [
                'remaining' => $n['target'] - $n['eaten'],
                'target' => $n['target'],
                'weight' => (100 - $n['percent']) / 100,
                'unit' => $n['unit'],
            ]])
            ->filter(fn ($gap) => $gap['remaining'] > 0);

        if ($gaps->isEmpty()) {
            return [];
        }

        $scored = collect($this->catalogue->all())
            ->filter(fn (array $food) => $this->isSuggestable($food, $gaps->all()))
            ->map(function (array $food, string $key) use ($gaps) {
                $contributions = $gaps->map(function ($gap, $nutrient) use ($food) {
                    $value = ($food[self::CATALOGUE_FIELDS[$nutrient]] ?? 0) * self::PORTION_G / 100;

                    return ['value' => $value, 'score' => $gap['weight'] * min($value, $gap['remaining']) / $gap['target']];
                });
                $score = $contributions->sum('score') * (FoodCatalogue::isLaVie($food) ? 1.15 : 1);

                return ['key' => $key, 'food' => $food, 'contributions' => $contributions, 'score' => $score];
            })
            ->filter(fn ($candidate) => $candidate['score'] > 0)
            ->sortByDesc('score')
            ->values();

        // Un seul aliment par « famille » (« Lentille corail » et « Lentille verte » → une seule lentille)
        $picked = $scored->unique(fn ($candidate) => Str::before($this->normalize($candidate['food']['name']), ' '))->take($limit);

        // Collaboration La Vie : un de leurs produits est proposé dès qu'il apporte quelque chose
        $bestLaVie = $scored->first(fn ($candidate) => FoodCatalogue::isLaVie($candidate['food']));
        if ($bestLaVie && ! $picked->contains(fn ($candidate) => FoodCatalogue::isLaVie($candidate['food']))) {
            $picked = $picked->take($limit - 1)->push($bestLaVie);
        }

        return $picked->map(fn ($candidate) => [
            'key' => $candidate['key'],
            'name' => $candidate['food']['name'],
            'weight_g' => self::PORTION_G,
            'benefits' => $candidate['contributions']
                ->filter(fn ($c) => $c['value'] > 0)
                ->sortByDesc('score')
                ->take(2)
                ->map(fn ($c, $nutrient) => '+'.$this->format($c['value']).' '.$gaps[$nutrient]['unit'].' '.self::SHORT_LABELS[$nutrient])
                ->join(' · '),
            'badge' => $candidate['food']['brand'] ?? null,
        ])->values()->all();
    }

    private function isSuggestable(array $food, array $gaps): bool
    {
        $name = $this->normalize($food['name']);

        if (preg_match(self::NOT_A_PORTION, $name)) {
            return false;
        }
        // « Pâté » se teste avec l'accent : sans accent, il se confondrait avec les pâtes
        $isMeat = preg_match(self::NOT_VEGETARIAN, $name) || preg_match('/(?<!\pL)pâtés?(?!\pL)/iu', $food['name']);
        if ($isMeat && ! preg_match(self::PLANT_BASED, $name)) {
            return false;
        }

        // Plus de 2 fois le besoin du jour dans 100 g : produit enrichi ou concentré, pas une portion réaliste
        foreach ($gaps as $nutrient => $gap) {
            if (($food[self::CATALOGUE_FIELDS[$nutrient]] ?? 0) > 2 * $gap['target']) {
                return false;
            }
        }

        return true;
    }

    private function normalize(string $text): string
    {
        return Str::of($text)->ascii()->lower()->replaceMatches('/[^a-z0-9 -]+/', ' ')->squish()->value();
    }

    /** 14 / 3,1 / 0,4 : nombre à la française, 1 décimale max (aucune au-delà de 10). */
    private function format(float $value): string
    {
        return str_replace('.', ',', (string) round($value, $value >= 10 ? 0 : 1));
    }
}
