<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductReviewRequest extends FormRequest
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
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'required|string|min:10|max:1000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'string|url',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages()
    {
        return [
            'rating.required' => 'Vui lòng chọn số sao đánh giá',
            'rating.min' => 'Đánh giá tối thiểu 1 sao',
            'rating.max' => 'Đánh giá tối đa 5 sao',
            'comment.required' => 'Vui lòng nhập nội dung đánh giá',
            'comment.min' => 'Nội dung đánh giá phải có ít nhất 10 ký tự',
            'comment.max' => 'Nội dung đánh giá không được quá 1000 ký tự',
            'images.max' => 'Chỉ được tải lên tối đa 5 ảnh',
        ];
    }
}
