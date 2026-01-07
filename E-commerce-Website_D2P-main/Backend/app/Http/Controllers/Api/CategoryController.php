<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use OpenApi\Annotations as OA;

class CategoryController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/categories",
     *     tags={"Categories"},
     *     summary="Danh sách danh mục",
     *     @OA\Parameter(name="with_children", in="query", description="Bao gồm danh mục con", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="only_active", in="query", description="Chỉ hiển thị danh mục đang hoạt động", @OA\Schema(type="boolean")),
     *     @OA\Response(response=200, description="Danh sách danh mục", @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Category")))
     * )
     */
    public function index(Request $request)
    {
        $categories = (function () use ($request) {
            $categories = Category::query()
                ->with('parent')
                ->withTotalProductsCount() // Đếm cả sản phẩm của children
                ->when($request->boolean('with_children'), fn ($q) => $q->with('children'))
                ->when($request->boolean('only_active'), fn ($q) => $q->where('is_active', true))
                // ✅ Sắp xếp theo created_at DESC (mới nhất lên đầu), sau đó theo position
                ->orderByDesc('created_at')
                ->orderBy('position')
                ->get();

            // Add total_products_count to each category
            $categories->each(function ($category) {
                $category->total_products_count = $category->total_products_count;
            });
            
            return $categories;
        })();

        return response()->json($categories);
    }

    /**
     * @OA\Post(
     *     path="/categories",
     *     tags={"Categories"},
     *     summary="Tạo danh mục mới",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CategoryStoreRequest")),
     *     @OA\Response(response=201, description="Danh mục được tạo", @OA\JsonContent(ref="#/components/schemas/Category")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ], [
            'name.unique' => 'Tên danh mục đã tồn tại. Vui lòng chọn tên khác.',
            'slug.unique' => 'Slug đã tồn tại. Vui lòng chọn slug khác.',
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $category = Category::create($data);

        // ✅ Broadcast event
        event(new \App\Events\CategoryCreated($category));

        return response()->json($category, 201);
    }

    /**
     * @OA\Get(
     *     path="/categories/{id}",
     *     tags={"Categories"},
     *     summary="Chi tiết danh mục",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Danh mục", @OA\JsonContent(ref="#/components/schemas/Category")),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Category $category)
    {
        $category->load('children', 'parent');

        return response()->json($category);
    }

    /**
     * @OA\Put(
     *     path="/categories/{id}",
     *     tags={"Categories"},
     *     summary="Cập nhật danh mục",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CategoryUpdateRequest")),
     *     @OA\Response(response=200, description="Danh mục cập nhật", @OA\JsonContent(ref="#/components/schemas/Category")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function update(Request $request, Category $category)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:categories,name,' . $category->id],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug,' . $category->id],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ], [
            'name.unique' => 'Tên danh mục đã tồn tại. Vui lòng chọn tên khác.',
            'slug.unique' => 'Slug đã tồn tại. Vui lòng chọn slug khác.',
        ]);

        if (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->fill($data)->save();

        // ✅ Broadcast event
        event(new \App\Events\CategoryUpdated($category));

        return response()->json($category->refresh());
    }

    /**
     * @OA\Delete(
     *     path="/categories/{id}",
     *     tags={"Categories"},
     *     summary="Xóa danh mục",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã xóa danh mục"),
     *     @OA\Response(response=400, description="Không thể xóa danh mục"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy(Request $request, Category $category)
    {
        $this->ensureAdmin($request);

        // Kiểm tra các ràng buộc trước khi xóa
        $canDelete = $this->canDeleteCategory($category);
        
        if (!$canDelete['can_delete']) {
            return response()->json([
                'message' => $canDelete['message'],
                'reasons' => $canDelete['reasons'],
                'suggestion' => 'Khuyến nghị: Vô hiệu hóa danh mục (is_active = false) thay vì xóa, hoặc di chuyển sản phẩm/danh mục con sang danh mục khác trước.'
            ], 400);
        }

        // Xóa danh mục (soft delete)
        $category->delete();

        return response()->json(['message' => 'Đã xóa danh mục thành công.']);
    }

    /**
     * Kiểm tra xem danh mục có thể xóa được không
     * 
     * Điều kiện để xóa được:
     * 1. Không có danh mục con
     * 2. Không có sản phẩm trong danh mục
     */
    protected function canDeleteCategory(Category $category): array
    {
        $reasons = [];
        
        // 1. Kiểm tra danh mục con
        $childrenCount = $category->children()->count();
        if ($childrenCount > 0) {
            $reasons[] = "Danh mục có {$childrenCount} danh mục con";
        }

        // 2. Kiểm tra sản phẩm trong danh mục
        $productsCount = $category->products()->count();
        if ($productsCount > 0) {
            $reasons[] = "Danh mục có {$productsCount} sản phẩm";
        }

        $canDelete = empty($reasons);
        
        return [
            'can_delete' => $canDelete,
            'message' => $canDelete 
                ? 'Có thể xóa danh mục' 
                : 'Không thể xóa danh mục vì các lý do sau:',
            'reasons' => $reasons
        ];
    }

    /**
     * Kiểm tra xem danh mục có thể xóa được không (API endpoint)
     * 
     * @OA\Get(
     *     path="/categories/{id}/can-delete",
     *     tags={"Categories"},
     *     summary="Kiểm tra xem danh mục có thể xóa được không",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Thông tin kiểm tra"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function canDelete(Request $request, Category $category)
    {
        $this->ensureAdmin($request);
        
        $result = $this->canDeleteCategory($category);
        
        return response()->json($result);
    }
}
