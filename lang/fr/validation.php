<?php

// Messages de validation en français (APP_LOCALE=fr). Seules les règles utilisées par l'appli sont traduites.
return [
    'after' => 'La date doit être postérieure au :date.',
    'before_or_equal' => 'La date ne peut pas être dans le futur.',
    'boolean' => 'Ce champ doit être vrai ou faux.',
    'confirmed' => 'Les deux mots de passe ne correspondent pas.',
    'current_password' => 'Le mot de passe est incorrect.',
    'date_format' => 'La date n’est pas valide.',
    'decimal' => 'Le nombre doit avoir au plus :decimal décimales.',
    'email' => 'L’adresse email n’est pas valide.',
    'gt' => [
        'numeric' => 'La valeur doit être supérieure à :value.',
    ],
    'in' => 'Ce choix n’est pas valide.',
    'integer' => 'La valeur doit être un nombre entier.',
    'lowercase' => 'L’adresse email doit être en minuscules.',
    'max' => [
        'numeric' => 'La valeur ne peut pas dépasser :max.',
        'string' => 'Ce champ ne peut pas dépasser :max caractères.',
    ],
    'min' => [
        'numeric' => 'La valeur doit être d’au moins :min.',
        'string' => 'Ton :attribute doit contenir au moins :min caractères.',
    ],
    'numeric' => 'La valeur doit être un nombre.',
    'password' => [
        'letters' => 'Ton mot de passe doit contenir au moins une lettre.',
        'mixed' => 'Ton mot de passe doit contenir une majuscule et une minuscule.',
        'numbers' => 'Ton mot de passe doit contenir au moins un chiffre.',
        'symbols' => 'Ton mot de passe doit contenir au moins un symbole.',
        'uncompromised' => 'Ce mot de passe est apparu dans une fuite de données : choisis-en un autre.',
    ],
    'required' => 'Ce champ est obligatoire.',
    'string' => 'Ce champ doit être un texte.',
    'unique' => 'Cette adresse email est déjà utilisée.',

    'attributes' => [
        'name' => 'prénom',
        'email' => 'email',
        'password' => 'mot de passe',
        'current_password' => 'mot de passe actuel',
        'sex' => 'sexe',
        'date_of_birth' => 'date de naissance',
        'height_cm' => 'taille',
        'weight_kg' => 'poids',
        'weight_g' => 'poids',
        'diet_status' => 'régime',
    ],
];
