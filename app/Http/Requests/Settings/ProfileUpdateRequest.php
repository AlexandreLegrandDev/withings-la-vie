<?php

namespace App\Http\Requests\Settings;

use App\Http\Controllers\Auth\RegisteredUserController;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Prénom et email obligatoires ; régime, sexe, date de naissance et taille seulement s'ils sont envoyés.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $profileRules = collect(RegisteredUserController::profileRules())
            ->map(fn (array $rules) => ['sometimes', ...$rules]);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($this->user()->id)],
            'diet_status' => ['sometimes', 'required', Rule::in(['transition', 'vegetarian'])],
            ...$profileRules->all(),
        ];
    }
}
