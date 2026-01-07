<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use OpenApi\Annotations as OA;

class ProductController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/products",
     *     tags={"Products"},
     *     summary="Danh sách sản phẩm",
     *     @OA\Parameter(name="search", in="query", description="Từ khóa tìm kiếm", @OA\Schema(type="string")),
     *     @OA\Parameter(name="category_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="price_min", in="query", @OA\Schema(type="number", format="float")),
     *     @OA\Parameter(name="price_max", in="query", @OA\Schema(type="number", format="float")),
     *     @OA\Parameter(name="only_featured", in="query", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách sản phẩm",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Product")),
     *             @OA\Property(property="meta", type="object"),
     *             @OA\Property(property="links", type="object")
     *         )
     *     )
     * )
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', $request->input('per_page', 15));
        $isAdmin = $request->user() && in_array($request->user()->role, ['admin', 'staff']);

        // Support 'search' parameter directly
        $searchTerm = $request->input('search');

        // Get filter array
        $filter = $request->input('filter', []);
        
        // ✅ Log filter để debug
        \Log::info('🔍 [ProductController] Request filters', [
            'filter' => $filter,
            'has_promotion' => $filter['has_promotion'] ?? 'NOT SET',
            'has_promotion_type' => isset($filter['has_promotion']) ? gettype($filter['has_promotion']) : 'N/A',
            'is_flash_sale' => $filter['is_flash_sale'] ?? 'NOT SET',
        ]);
        
        $queryBuilder = $this->buildProductQuery($request, $limit, $searchTerm, $filter, $isAdmin);
        $products = $queryBuilder->paginate($limit);
        
        // Thêm thông tin giá hiệu lực và khuyến mãi cho từng sản phẩm
        $products->getCollection()->transform(function ($product) {
            $product->effective_price = $product->effective_price;
            $product->has_active_promotion = $product->has_active_promotion;
            $product->active_promotion_info = $product->active_promotion;
            // ✅ Đảm bảo promotions được load và serialize
            $product->makeVisible(['promotions']);
            return $product;
        });

        return response()->json($products);
    }
    
    /**
     * Build product query (extracted to avoid code duplication)
     */
    protected function buildProductQuery($request, $limit, $searchTerm, $filter, $isAdmin)
    {
        return Product::query()
                ->with([
                    'category:id,name,slug', // ✅ Chỉ lấy field cần thiết
                    'promotions' => function($query) {
                        $query->select('promotions.id', 'name', 'promotion_type', 'value', 'is_active', 'starts_at', 'ends_at')
                              ->where('is_active', true)
                              ->where(function($q) {
                                  $now = now();
                                  $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
                              })
                              ->where(function($q) {
                                  $now = now();
                                  $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
                              });
                    }
                ])
                // ✅ KHÔNG load images - chỉ dùng thumbnail
                ->select('id', 'category_id', 'name', 'slug', 'sku', 'thumbnail', 'price', 'original_price', 'quantity', 'status', 'is_featured', 'sold_count', 'published_at', 'created_at')
            ->when(!empty($searchTerm), function ($query) use ($searchTerm) {
                // Tách từ khóa thành các từ riêng lẻ
                $keywords = preg_split('/\s+/', trim($searchTerm));
                
                // Nếu chỉ có 1 từ, tìm bình thường
                if (count($keywords) === 1) {
                    $query->where(function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('sku', 'like', "%{$searchTerm}%")
                            ->orWhere('description', 'like', "%{$searchTerm}%")
                            ->orWhere('short_description', 'like', "%{$searchTerm}%");
                    });
                } else {
                    // Nhiều từ: TẤT CẢ các từ phải xuất hiện (AND)
                    $query->where(function ($q) use ($keywords) {
                        foreach ($keywords as $keyword) {
                            if (strlen($keyword) >= 2) {
                                $q->where(function ($subQ) use ($keyword) {
                                    $subQ->where('name', 'like', "%{$keyword}%")
                                         ->orWhere('description', 'like', "%{$keyword}%")
                                         ->orWhere('short_description', 'like', "%{$keyword}%");
                                });
                            }
                        }
                    });
                }
            })
            ->when(!empty($filter['category_id']), function ($query) use ($filter) {
                $categoryId = $filter['category_id'];
                $query->where(function ($q) use ($categoryId) {
                    // Include products in the selected category
                    $q->where('category_id', $categoryId)
                      // Also include products in child categories
                      ->orWhereHas('category', function ($subQuery) use ($categoryId) {
                          $subQuery->where('parent_id', $categoryId);
                      });
                });
            })
            ->when(!empty($filter['price_min']), function ($q) use ($filter) {
                return $q->where('price', '>=', $filter['price_min']);
            })
            ->when(!empty($filter['price_max']), function ($q) use ($filter) {
                return $q->where('price', '<=', $filter['price_max']);
            })
            ->when(!empty($filter['is_featured']), fn ($q) => $q->where('is_featured', true))
            ->when(!empty($filter['is_flash_sale']), function ($query) {
                // Filter products that have active FLASH SALE promotions
                $query->whereHas('promotions', function ($sq) {
                    $sq->where('is_active', true)
                        ->where('is_flash_sale', true)
                        ->where(function ($ssq) {
                            $now = now();
                            $ssq->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
                        })
                        ->where(function ($ssq) {
                            $now = now();
                            $ssq->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
                        });
                });
            })
            ->when(!empty($filter['has_promotion']), function ($query) use ($filter) {
                // Filter products that have active special_offer promotions ONLY
                // KHÔNG lấy flash_sale (flash_sale có section riêng)
                $query->whereHas('promotions', function ($sq) {
                    $sq->where('is_active', true)
                        // CHỈ lấy special_offer (khuyến mãi đặc biệt)
                        // KHÔNG lấy flash_sale
                        ->where('promotion_category', 'special_offer')
                        ->where(function ($ssq) {
                            $now = now();
                            $ssq->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
                        })
                        ->where(function ($ssq) {
                            $now = now();
                            $ssq->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
                        });
                });
            })
            // Only filter by status for non-admin users (unless with_trashed is requested)
            ->when(!$isAdmin && !$request->boolean('with_trashed'), fn ($q) => $q->where('status', 'published'))
            ->when($request->filled('sort'), function ($query) use ($request) {
                $sort = $request->input('sort');
                if ($sort === '-created_at' || $sort === 'latest') {
                    $query->orderByDesc('created_at');
                } elseif ($sort === 'price_asc') {
                    $query->orderBy('price');
                } elseif ($sort === 'price_desc') {
                    $query->orderByDesc('price');
                } elseif ($sort === 'bestseller') {
                    $query->orderByDesc('sold_count');
                } else {
                    $query->orderByDesc('published_at');
                }
            }, fn ($q) => $q->orderByDesc('created_at')) // ✅ Admin: Sort theo created_at (mới nhất trước)
            ->when(!$request->boolean('with_trashed'), fn ($q) => $q->whereNull('deleted_at'));
    }

    /**
     * Lấy tất cả sản phẩm không lọc, đầy đủ thông tin
     */
    public function all(Request $request)
    {
        $products = Product::with([
            'category:id,name,slug',
            'supplier:id,name',
            'images',
            'promotions' => function($query) {
                $query->where('is_active', true)
                      ->where(function($q) {
                          $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                      })
                      ->where(function($q) {
                          $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                      });
            }
        ])
        ->orderByDesc('created_at')
        ->get();

        $products->transform(function ($product) {
            $product->effective_price = $product->effective_price;
            $product->has_active_promotion = $product->has_active_promotion;
            $product->active_promotion_info = $product->active_promotion;
            return $product;
        });

        return response()->json([
            'data' => $products,
            'total' => $products->count()
        ]);
    }

    /**
     * @OA\Post(
     *     path="/products",
     *     tags={"Products"},
     *     summary="Tạo sản phẩm mới",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Product")
     *     ),
     *     @OA\Response(response=201, description="Tạo thành công", @OA\JsonContent(ref="#/components/schemas/Product")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $this->validateProduct($request);

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Force quantity = 0 khi tạo mới (chỉ cộng khi nhập hàng)
        $data['quantity'] = 0;

        // Xử lý upload thumbnail lên Cloudinary
        if ($request->hasFile('thumbnail_file')) {
            $cloudinary = app(CloudinaryService::class);
            $thumbnailFile = $request->file('thumbnail_file');

            if ($cloudinary->isConfigured()) {
                // Upload lên Cloudinary
                $result = $cloudinary->uploadImage($thumbnailFile, 'products', 'thumbnail_' . time() . '_' . uniqid());
                if ($result) {
                    $data['thumbnail'] = $result['url'];
                }
            } else {
                // Fallback: lưu local nếu Cloudinary chưa cấu hình
                $thumbnailName = time() . '_' . uniqid() . '.' . $thumbnailFile->getClientOriginalExtension();
                $thumbnailFile->move(public_path('uploads/products'), $thumbnailName);
                $data['thumbnail'] = '/uploads/products/' . $thumbnailName;
            }
        }

        $product = Product::create($data);

        // Xử lý upload gallery images
        if ($request->hasFile('gallery_files')) {
            $this->uploadGalleryImages($product, $request->file('gallery_files'));
        } elseif ($images = $request->input('images', [])) {
            $this->syncImages($product, $images);
        }

        if ($promotionIds = $request->input('promotion_ids')) {
            $product->promotions()->sync($promotionIds);
        }

        // ✅ Broadcast event
        event(new \App\Events\ProductCreated($product));

        return response()->json($product->load('images', 'promotions'), 201);
    }

    /**
     * @OA\Get(
     *     path="/products/{id}",
     *     tags={"Products"},
     *     summary="Chi tiết sản phẩm",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết sản phẩm", @OA\JsonContent(ref="#/components/schemas/Product")),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Product $product)
    {
        $product->load(['category', 'supplier', 'images', 'promotions']);

        // Thêm thông tin khuyến mãi vào response
        $product->effective_price = $product->effective_price;
        $product->has_active_promotion = $product->has_active_promotion;

        return response()->json($product);
    }

    /**
     * @OA\Put(
     *     path="/products/{id}",
     *     tags={"Products"},
     *     summary="Cập nhật sản phẩm",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/Product")),
     *     @OA\Response(response=200, description="Cập nhật thành công", @OA\JsonContent(ref="#/components/schemas/Product")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function update(Request $request, Product $product)
    {
        $this->ensureAdmin($request);

        $data = $this->validateProduct($request, $product->id);

        if (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Kiểm tra nếu chuyển sang trạng thái discontinued và còn tồn kho
        $isChangingToDiscontinued = isset($data['status']) && 
                                     $data['status'] === 'discontinued' && 
                                     $product->status !== 'discontinued';
        
        if ($isChangingToDiscontinued && $product->quantity > 0) {
            // Cảnh báo nhưng vẫn cho phép (không block)
            $warning = "Lưu ý: Sản phẩm còn {$product->quantity} trong kho. Khuyến nghị xử lý tồn kho trước khi ngừng kinh doanh.";
        }

        // Xử lý upload thumbnail mới lên Cloudinary
        if ($request->hasFile('thumbnail_file')) {
            $cloudinary = app(CloudinaryService::class);
            $thumbnailFile = $request->file('thumbnail_file');

            if ($cloudinary->isConfigured()) {
                // Xóa ảnh cũ trên Cloudinary nếu có
                if (!empty($product->thumbnail) && $cloudinary->isCloudinaryUrl($product->thumbnail)) {
                    $cloudinary->deleteImage($product->thumbnail);
                }

                // Upload ảnh mới lên Cloudinary
                $result = $cloudinary->uploadImage($thumbnailFile, 'products', 'thumbnail_' . $product->id . '_' . time());
                if ($result) {
                    $data['thumbnail'] = $result['url'];
                }
            } else {
                // Fallback: lưu local nếu Cloudinary chưa cấu hình
                $thumbnailName = time() . '_' . uniqid() . '.' . $thumbnailFile->getClientOriginalExtension();
                $thumbnailFile->move(public_path('uploads/products'), $thumbnailName);
                $data['thumbnail'] = '/uploads/products/' . $thumbnailName;
            }
        }

        $product->fill($data)->save();

        // Xử lý upload gallery images mới
        if ($request->hasFile('gallery_files')) {
            $this->uploadGalleryImages($product, $request->file('gallery_files'));
        } elseif ($request->has('images')) {
            $this->syncImages($product, $request->input('images', []));
        }

        if ($request->has('promotion_ids')) {
            $product->promotions()->sync($request->input('promotion_ids', []));
        }

        $response = [
            'message' => 'Cập nhật sản phẩm thành công.',
            'product' => $product->load('images', 'promotions')
        ];

        // Thêm cảnh báo nếu có
        if (isset($warning)) {
            $response['warning'] = $warning;
            $response['inventory_suggestions'] = [
                'Bán tại cửa hàng (POS) cho đến khi hết hàng',
                'Tạo phiếu xuất thanh lý/hủy để xử lý tồn kho',
                'Giảm giá để bán nhanh trước khi ngừng kinh doanh',
                'Chuyển kho hoặc trả lại nhà cung cấp'
            ];
        }

        // ✅ Broadcast event
        event(new \App\Events\ProductUpdated($product));

        return response()->json($response);
    }

    /**
     * @OA\Delete(
     *     path="/products/{id}",
     *     tags={"Products"},
     *     summary="Xóa sản phẩm",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã xóa sản phẩm"),
     *     @OA\Response(response=400, description="Không thể xóa sản phẩm"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy(Request $request, Product $product)
    {
        $this->ensureAdmin($request);

        // Kiểm tra các ràng buộc trước khi xóa
        $canDelete = $this->canDeleteProduct($product);
        
        if (!$canDelete['can_delete']) {
            // Nếu không thể xóa, đề xuất ngừng kinh doanh
            return response()->json([
                'message' => $canDelete['message'],
                'reasons' => $canDelete['reasons'],
                'suggestion' => 'Khuyến nghị: Sử dụng chức năng "Cập nhật" để chuyển trạng thái sang "Ngừng kinh doanh" thay vì xóa. Điều này sẽ ẩn sản phẩm khỏi website nhưng vẫn giữ lại dữ liệu lịch sử.'
            ], 400);
        }

        // Xóa ảnh trên Cloudinary nếu có
        $cloudinary = app(CloudinaryService::class);
        if ($cloudinary->isConfigured()) {
            // Xóa thumbnail
            if (!empty($product->thumbnail) && $cloudinary->isCloudinaryUrl($product->thumbnail)) {
                $cloudinary->deleteImage($product->thumbnail);
            }
            
            // Xóa gallery images
            foreach ($product->images as $image) {
                if ($cloudinary->isCloudinaryUrl($image->path)) {
                    $cloudinary->deleteImage($image->path);
                }
            }
        }

        // Xóa images trong database
        $product->images()->delete();

        // Lưu product ID trước khi xóa
        $productId = $product->id;

        // Xóa sản phẩm (soft delete)
        $product->delete();

        // ✅ Broadcast event
        event(new \App\Events\ProductDeleted($productId));

        return response()->json(['message' => 'Đã xóa sản phẩm thành công.']);
    }

    /**
     * Kiểm tra xem sản phẩm có thể xóa được không
     * 
     * Điều kiện để xóa được:
     * 1. Không có trong đơn hàng nào (hoặc chỉ có trong đơn đã hủy/hoàn trả)
     * 2. Không có trong giỏ hàng nào
     * 3. Số lượng tồn kho = 0 (đã bán hết hoặc chưa nhập hàng)
     * 4. Không có trong yêu cầu bảo hành đang xử lý
     */
    protected function canDeleteProduct(Product $product): array
    {
        $reasons = [];
        
        // 1. Kiểm tra đơn hàng
        $ordersCount = \DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.product_id', $product->id)
            ->whereNotIn('orders.status', ['cancelled', 'returned'])
            ->whereNull('orders.deleted_at')
            ->count();
        
        if ($ordersCount > 0) {
            $reasons[] = "Sản phẩm đang có trong {$ordersCount} đơn hàng chưa hoàn thành";
        }

        // 2. Kiểm tra giỏ hàng
        $cartItemsCount = \DB::table('cart_items')
            ->join('carts', 'cart_items.cart_id', '=', 'carts.id')
            ->where('cart_items.product_id', $product->id)
            ->where('carts.status', 'active')
            ->count();
        
        if ($cartItemsCount > 0) {
            $reasons[] = "Sản phẩm đang có trong {$cartItemsCount} giỏ hàng";
        }

        // 3. Kiểm tra tồn kho
        if ($product->quantity > 0) {
            $reasons[] = "Sản phẩm còn {$product->quantity} trong kho. Vui lòng xuất hết hàng trước khi xóa";
        }

        // 4. Kiểm tra bảo hành (nếu có bảng warranties)
        if (\Schema::hasTable('warranties')) {
            $activeWarrantiesCount = \DB::table('warranties')
                ->where('product_id', $product->id)
                ->whereIn('status', ['active', 'pending'])
                ->count();
            
            if ($activeWarrantiesCount > 0) {
                $reasons[] = "Sản phẩm đang có {$activeWarrantiesCount} yêu cầu bảo hành đang xử lý";
            }
        }

        // 5. Kiểm tra yêu cầu trả hàng (nếu có bảng return_requests và return_request_items)
        if (\Schema::hasTable('return_requests') && \Schema::hasTable('return_request_items')) {
            $activeReturnRequestsCount = \DB::table('return_requests')
                ->join('return_request_items', 'return_requests.id', '=', 'return_request_items.return_request_id')
                ->where('return_request_items.product_id', $product->id)
                ->whereIn('return_requests.status', ['pending', 'approved', 'processing'])
                ->count();
            
            if ($activeReturnRequestsCount > 0) {
                $reasons[] = "Sản phẩm đang có {$activeReturnRequestsCount} yêu cầu trả hàng đang xử lý";
            }
        }

        $canDelete = empty($reasons);
        
        return [
            'can_delete' => $canDelete,
            'message' => $canDelete 
                ? 'Có thể xóa sản phẩm' 
                : 'Không thể xóa sản phẩm vì các lý do sau:',
            'reasons' => $reasons
        ];
    }

    /**
     * Kiểm tra xem sản phẩm có thể xóa được không (API endpoint)
     * 
     * @OA\Get(
     *     path="/products/{id}/can-delete",
     *     tags={"Products"},
     *     summary="Kiểm tra xem sản phẩm có thể xóa được không",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Thông tin kiểm tra"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function canDelete(Request $request, Product $product)
    {
        $this->ensureAdmin($request);
        
        $result = $this->canDeleteProduct($product);
        
        return response()->json($result);
    }

    protected function validateProduct(Request $request, ?int $productId = null): array
    {
        return $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku,' . $productId],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug,' . $productId],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'attributes' => ['nullable'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            // Cho phép giá bán < giá nhập (trường hợp xả hàng, thanh lý)
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'reorder_point' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['boolean'],
            'status' => ['nullable', 'string'],
            'warranty_months' => ['nullable', 'integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'dimensions' => ['nullable', 'string'],
            'published_at' => ['nullable', 'date'],
            'images' => ['nullable', 'array'],
            'images.*.id' => ['nullable', 'integer', 'exists:product_images,id'],
            'images.*.path' => ['required_with:images', 'string'],
            'images.*.is_primary' => ['sometimes', 'boolean'],
            'images.*.position' => ['sometimes', 'integer', 'min:0'],
            'promotion_ids' => ['nullable', 'array'],
            'promotion_ids.*' => ['integer', 'exists:promotions,id'],
        ], [
            'images.*.path.required_with' => 'Đường dẫn hình ảnh là bắt buộc.',
        ]);
    }

    protected function syncImages(Product $product, array $images): void
    {
        $product->images()->delete();

        foreach ($images as $index => $image) {
            $product->images()->create([
                'path' => $image['path'],
                'is_primary' => $image['is_primary'] ?? $index === 0,
                'position' => $image['position'] ?? $index,
            ]);
        }

        if (empty($product->thumbnail) && !empty($images[0]['path'])) {
            $product->update(['thumbnail' => $images[0]['path']]);
        }
    }

    /**
     * Upload gallery images từ file lên Cloudinary
     */
    protected function uploadGalleryImages(Product $product, array $files): void
    {
        $cloudinary = app(CloudinaryService::class);

        // Xóa ảnh gallery cũ trên Cloudinary
        if ($cloudinary->isConfigured()) {
            foreach ($product->images as $oldImage) {
                if ($cloudinary->isCloudinaryUrl($oldImage->path)) {
                    $cloudinary->deleteImage($oldImage->path);
                }
            }
        }

        // Xóa records trong database
        $product->images()->delete();

        foreach ($files as $index => $file) {
            $path = null;

            if ($cloudinary->isConfigured()) {
                // Upload lên Cloudinary
                $publicId = 'gallery_' . $product->id . '_' . $index . '_' . time();
                $result = $cloudinary->uploadImage($file, 'products', $publicId);
                if ($result) {
                    $path = $result['url'];
                }
            }

            // Fallback: lưu local nếu Cloudinary chưa cấu hình hoặc upload thất bại
            if (empty($path)) {
                $fileName = time() . '_' . uniqid() . '_' . $index . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/products'), $fileName);
                $path = '/uploads/products/' . $fileName;
            }

            $product->images()->create([
                'path' => $path,
                'is_primary' => $index === 0,
                'position' => $index,
            ]);
        }
    }

    /**
     * @OA\Post(
     *     path="/products/generate-sku",
     *     tags={"Products"},
     *     summary="Tự động tạo mã SKU",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="category_id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="Tivi Samsung 55 inch")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="SKU được tạo thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="sku", type="string", example="TV-SAM-55INCH-001")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền")
     * )
     */
    public function generateSku(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $category = \App\Models\Category::find($request->category_id);
        $productName = $request->name;

        // Tạo prefix từ category
        $categoryPrefix = $this->getCategoryPrefix($category->name);

        // Tạo brand code từ tên sản phẩm (lấy từ đầu tiên - thường là thương hiệu)
        $brandCode = $this->extractBrandCode($productName);

        // Tạo model code từ tên sản phẩm
        $modelCode = $this->extractModelCode($productName);

        // Tạo SKU cơ bản
        $baseSku = strtoupper("{$categoryPrefix}-{$brandCode}-{$modelCode}");

        // Kiểm tra trùng lặp và thêm số nếu cần
        $sku = $baseSku;
        $counter = 1;
        while (Product::where('sku', $sku)->exists()) {
            $sku = $baseSku . '-' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            $counter++;
        }

        return response()->json(['sku' => $sku]);
    }

    /**
     * Tạo prefix từ tên danh mục
     */
    private function getCategoryPrefix(string $categoryName): string
    {
        $prefixMap = [
            // Điện tử
            'tivi' => 'TV',
            'ti vi' => 'TV',
            'television' => 'TV',
            'laptop' => 'LAP',
            'máy tính xách tay' => 'LAP',
            'điện thoại' => 'PHN',
            'phone' => 'PHN',
            'smartphone' => 'PHN',
            'tablet' => 'TAB',
            'máy tính bảng' => 'TAB',

            // Gia dụng
            'tủ lạnh' => 'REF',
            'refrigerator' => 'REF',
            'máy giặt' => 'WM',
            'washing machine' => 'WM',
            'điều hòa' => 'AC',
            'máy lạnh' => 'AC',
            'air conditioner' => 'AC',
            'lò vi sóng' => 'MW',
            'microwave' => 'MW',
            'máy hút bụi' => 'VC',
            'vacuum' => 'VC',
            'nồi cơm' => 'RC',
            'rice cooker' => 'RC',
            'bếp' => 'STB',
            'bếp từ' => 'IND',
            'bếp gas' => 'GAS',
            'máy xay' => 'BLD',
            'blender' => 'BLD',
            'quạt' => 'FAN',
            'fan' => 'FAN',
            'bình nóng lạnh' => 'WH',
            'water heater' => 'WH',
            'máy lọc nước' => 'WP',
            'water purifier' => 'WP',
            'máy sấy' => 'DRY',
            'dryer' => 'DRY',

            // Âm thanh
            'loa' => 'SPK',
            'speaker' => 'SPK',
            'tai nghe' => 'HP',
            'headphone' => 'HP',
            'earphone' => 'EP',

            // Camera
            'camera' => 'CAM',
            'máy ảnh' => 'CAM',

            // Phụ kiện
            'phụ kiện' => 'ACC',
            'accessory' => 'ACC',
        ];

        $lowerName = mb_strtolower($categoryName);

        foreach ($prefixMap as $key => $prefix) {
            if (str_contains($lowerName, $key)) {
                return $prefix;
            }
        }

        // Nếu không tìm thấy, tạo từ 3 ký tự đầu
        $words = preg_split('/\s+/', $categoryName);
        if (count($words) >= 2) {
            return strtoupper(mb_substr($words[0], 0, 1) . mb_substr($words[1], 0, 2));
        }
        return strtoupper(mb_substr(preg_replace('/[^a-zA-Z0-9]/', '', $categoryName), 0, 3));
    }

    /**
     * Trích xuất mã thương hiệu từ tên sản phẩm
     */
    private function extractBrandCode(string $productName): string
    {
        $brandMap = [
            'samsung' => 'SAM',
            'lg' => 'LG',
            'sony' => 'SNY',
            'panasonic' => 'PAN',
            'toshiba' => 'TOS',
            'sharp' => 'SHP',
            'philips' => 'PHL',
            'electrolux' => 'ELX',
            'hitachi' => 'HIT',
            'mitsubishi' => 'MIT',
            'daikin' => 'DAI',
            'aqua' => 'AQU',
            'casper' => 'CAS',
            'tcl' => 'TCL',
            'xiaomi' => 'XMI',
            'apple' => 'APL',
            'iphone' => 'APL',
            'ipad' => 'APL',
            'macbook' => 'APL',
            'dell' => 'DEL',
            'hp' => 'HP',
            'asus' => 'ASU',
            'acer' => 'ACR',
            'lenovo' => 'LNV',
            'msi' => 'MSI',
            'oppo' => 'OPP',
            'vivo' => 'VIV',
            'realme' => 'RLM',
            'huawei' => 'HUA',
            'nokia' => 'NOK',
            'jbl' => 'JBL',
            'bose' => 'BOS',
            'marshall' => 'MAR',
            'harman' => 'HAR',
            'kangaroo' => 'KAN',
            'sunhouse' => 'SUN',
            'lock&lock' => 'LCK',
            'lock lock' => 'LCK',
            'tefal' => 'TEF',
            'bluestone' => 'BLS',
            'midea' => 'MID',
            'sanaky' => 'SNK',
            'funiki' => 'FUN',
        ];

        $lowerName = mb_strtolower($productName);

        foreach ($brandMap as $brand => $code) {
            if (str_contains($lowerName, $brand)) {
                return $code;
            }
        }

        // Lấy từ đầu tiên làm brand code
        $words = preg_split('/\s+/', $productName);
        $firstWord = preg_replace('/[^a-zA-Z0-9]/', '', $words[0] ?? '');
        return strtoupper(mb_substr($firstWord, 0, 3));
    }

    /**
     * Trích xuất model code từ tên sản phẩm
     */
    private function extractModelCode(string $productName): string
    {
        // Tìm các ký tự số và chữ cái liền nhau (thường là model number)
        preg_match_all('/[A-Z0-9]{2,}[A-Z0-9\-]*/i', $productName, $matches);

        if (!empty($matches[0])) {
            // Lấy model number dài nhất (thường là chính xác nhất)
            $modelNumbers = $matches[0];
            usort($modelNumbers, fn($a, $b) => strlen($b) - strlen($a));

            $model = preg_replace('/[^a-zA-Z0-9]/', '', $modelNumbers[0]);
            return strtoupper(mb_substr($model, 0, 10));
        }

        // Nếu không tìm thấy, tạo từ các từ cuối
        $words = preg_split('/\s+/', $productName);
        $lastWords = array_slice($words, -2);
        $code = '';
        foreach ($lastWords as $word) {
            $code .= mb_substr(preg_replace('/[^a-zA-Z0-9]/', '', $word), 0, 4);
        }

        return strtoupper($code) ?: 'GEN';
    }

    /**
     * Upload ảnh lên Cloudinary (cho review, v.v.)
     */
    public function uploadImage(Request $request, CloudinaryService $cloudinary)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // Max 5MB
        ]);

        try {
            $result = $cloudinary->uploadImage($request->file('image'), 'reviews');

            if (!$result) {
                return response()->json([
                    'message' => 'Không thể upload ảnh lên Cloudinary'
                ], 500);
            }

            return response()->json([
                'message' => 'Upload ảnh thành công',
                'url' => $result['url'],
                'public_id' => $result['public_id'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi upload ảnh: ' . $e->getMessage()
            ], 500);
        }
    }
}
