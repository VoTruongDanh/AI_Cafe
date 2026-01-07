<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactFormSubmission;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use OpenApi\Annotations as OA;

class ContactController extends Controller
{
    /**
     * @OA\Post(
     *     path="/contact",
     *     tags={"Contact"},
     *     summary="Gửi form liên hệ",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","subject","message"},
     *             @OA\Property(property="name", type="string", example="Nguyen Van A"),
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="phone", type="string", nullable=true, example="0987654321"),
     *             @OA\Property(property="subject", type="string", example="Hỏi về sản phẩm"),
     *             @OA\Property(property="message", type="string", example="Tôi muốn hỏi về...")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Gửi thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể."),
     *             @OA\Property(property="data", ref="#/components/schemas/Contact")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        // Lưu vào database
        $contact = Contact::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'pending',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Gửi email thông báo cho admin
        try {
            Mail::to(config('mail.admin_email', 'admin@electroshop.vn'))
                ->send(new ContactFormSubmission($contact));
        } catch (\Exception $e) {
            \Log::error('Failed to send contact form email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
            'data' => $contact,
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/admin/contacts",
     *     tags={"Admin - Contact"},
     *     summary="Lấy danh sách liên hệ (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Lọc theo trạng thái",
     *         @OA\Schema(type="string", enum={"pending", "processing", "resolved"})
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Số trang",
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Response(response=200, description="Danh sách liên hệ"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền")
     * )
     */
    public function index(Request $request)
    {
        $query = Contact::query()->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $contacts = $query->paginate(20);

        return response()->json($contacts);
    }

    /**
     * @OA\Get(
     *     path="/admin/contacts/{id}",
     *     tags={"Admin - Contact"},
     *     summary="Xem chi tiết liên hệ (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Chi tiết liên hệ"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show($id)
    {
        $contact = Contact::findOrFail($id);
        return response()->json($contact);
    }

    /**
     * @OA\Put(
     *     path="/admin/contacts/{id}/status",
     *     tags={"Admin - Contact"},
     *     summary="Cập nhật trạng thái liên hệ (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(property="status", type="string", enum={"pending", "processing", "resolved"}),
     *             @OA\Property(property="admin_note", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cập nhật thành công"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function updateStatus(Request $request, $id)
    {
        $contact = Contact::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'in:pending,processing,resolved'],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $contact->update($data);

        return response()->json([
            'message' => 'Cập nhật trạng thái thành công',
            'data' => $contact,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/admin/contacts/{id}",
     *     tags={"Admin - Contact"},
     *     summary="Xóa liên hệ (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Xóa thành công"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy($id)
    {
        $contact = Contact::findOrFail($id);
        $contact->delete();

        return response()->json([
            'message' => 'Xóa liên hệ thành công',
        ]);
    }
}
