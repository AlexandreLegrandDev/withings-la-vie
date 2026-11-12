# Veggings

## Prérequis

- PHP 8.2+ (avec l'extension `pdo_sqlite`)
- Composer
- Node.js 20+

## Installation

```bash
git clone https://github.com/AlexandreLegrandDev/withings-la-vie.git
cd withings-la-vie

composer install
npm install

cp .env.example .env
php artisan key:generate
php artisan migrate
```

`php artisan migrate` crée la base SQLite (`database/database.sqlite`) : répondre **yes** quand il le demande.

## Lancement

```bash
composer run dev
```

Puis ouvrir http://localhost:8000 et créer un compte.

L'application est pensée pour mobile : l'afficher en mode mobile dans le navigateur (F12, puis l'icône téléphone).
