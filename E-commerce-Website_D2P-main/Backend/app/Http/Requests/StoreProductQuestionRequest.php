<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductQuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'question' => 'required|string|min:10|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages()
    {
        return [
            'question.required' => 'Vui lòng nhập câu hỏi',
            'question.min' => 'Câu hỏi phải có ít nhất 10 ký tự',
            'question.max' => 'Câu hỏi không được quá 500 ký tự',
        ];
    }
}
