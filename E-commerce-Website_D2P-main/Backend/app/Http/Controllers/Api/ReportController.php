<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Promotion;
use App\Models\User;
use App\Models\Warranty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function banHang()
    {
        try {
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();

            // 1. Doanh thu hôm nay
            $doanhThuHomNay = Order::whereDate('placed_at', $today)
                ->where('status', 'completed')
                ->sum('grand_total');

            // 2. Doanh thu hôm qua
            $doanhThuHomQua = Order::whereDate('placed_at', $yesterday)
                ->where('status', 'completed')
                ->sum('grand_total');

            // 3. Tính tỷ lệ
            $tyLeSoVoiHomQua = 0;
            if ($doanhThuHomQua > 0) {
                $tyLeSoVoiHomQua = (($doanhThuHomNay - $doanhThuHomQua) / $doanhThuHomQua) * 100;
            } elseif ($doanhThuHomNay > 0) {
                $tyLeSoVoiHomQua = 100;
            }

            // 4. Số đơn hôm nay
            $soDonHomNay = Order::whereDate('placed_at', $today)->count();

            // 5. Số đơn hoàn thành hôm nay
            $soDonHoanThanh = Order::whereDate('placed_at', $today)
                ->where('status', 'completed')
                ->count();

            // 6. Tổng số đơn từ trước đến nay
            $tongSoDon = Order::count();

            return response()->json([
                'data' => [
                    'doanh_thu_hom_nay' => (float) $doanhThuHomNay,
                    'ty_le_so_voi_hom_qua' => round($tyLeSoVoiHomQua, 1),
                    'so_don_hom_nay' => $soDonHomNay,
                    'so_don_hoan_thanh' => $soDonHoanThanh,
                    'tong_so_don_tu_truoc_den_nay' => $tongSoDon
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê bán hàng',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function tongQuan(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'required|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay'
        ]);

        try {
            [$startDate, $endDate, $label] = $this->getDateRange($request);

            // 1. Tổng quát
            $tongQuat = $this->getTongQuatDashboard($startDate, $endDate);

            // 2. Doanh thu theo tháng (6 tháng gần nhất)
            $doanhThuTheoThang = $this->getDoanhThuTheoThang();

            // 3. Doanh số tuần này (7 ngày)
            $doanhSoTuanNay = $this->getDoanhSoTuanNay();

            // 4. Phân bổ sản phẩm theo danh mục
            $phanBoSanPham = $this->getPhanBoSanPham();

            // 5. Top sản phẩm 30 ngày
            $topSanPham30Ngay = $this->getTopSanPham30Ngay();

            return response()->json([
                'data' => [
                    'tong_quat' => $tongQuat,
                    'doanh_thu_theo_thang' => $doanhThuTheoThang,
                    'doanh_so_tuan_nay' => $doanhSoTuanNay,
                    'phan_bo_san_pham' => $phanBoSanPham,
                    'top_san_pham_30_ngay' => $topSanPham30Ngay
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function doanhThu(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'required|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chinh,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date',
            'loai_thong_ke' => 'required|in:doanh_thu,san_pham,khach_hang'
        ]);

        $loaiThoiGian = $request->loai_thoi_gian;
        [$startDate, $endDate, $label] = $this->getDateRange($request);

        // Tính toán dữ liệu thực theo khoảng thời gian
        $tongQuat = $this->getTongQuat($startDate, $endDate, $label);
        $bieuDoThang = $this->getBieuDoThang($startDate, $endDate, $loaiThoiGian);
        $doanhThuSanPham = $this->getDoanhThuSanPham($startDate, $endDate);
        $chiTietThang = $this->getChiTietThang($startDate, $endDate, $loaiThoiGian);

        return response()->json([
            'data' => [
                'tong_quat' => $tongQuat,
                'bieu_do_thang' => $bieuDoThang,
                'doanh_thu_san_pham' => $doanhThuSanPham,
                'chi_tiet_thang' => $chiTietThang
            ]
        ]);
    }

    public function sanPham(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'nullable|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chinh,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date'
        ]);

        try {
            $loaiThoiGian = $request->input('loai_thoi_gian', 'thang_nay');
            [$startDate, $endDate, $label] = $this->getDateRange($request);

            $topSanPhamBanChay = $this->getTopSanPhamBanChay($startDate, $endDate);
            $doanhThuTheoSanPham = $this->getDoanhThuTheoSanPham2($startDate, $endDate);
            $chiTietSanPham = $this->getChiTietSanPham($startDate, $endDate);

            return response()->json([
                'data' => [
                    'top_san_pham_ban_chay' => $topSanPhamBanChay,
                    'doanh_thu_theo_san_pham' => $doanhThuTheoSanPham,
                    'chi_tiet_san_pham' => $chiTietSanPham
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function tonKho(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'nullable|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chinh,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date',
            'loai_thong_ke' => 'nullable|in:ton_kho'
        ]);

        try {
            $tongQuat = $this->getTongQuatTonKho();
            $tonKhoTheoDanhMuc = $this->getTonKhoTheoDanhMuc();
            $chiTietTonKho = $this->getChiTietTonKho();

            return response()->json([
                'data' => [
                    'tong_quat' => $tongQuat,
                    'ton_kho_theo_danh_muc' => $tonKhoTheoDanhMuc,
                    'chi_tiet_ton_kho' => $chiTietTonKho
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function khachHang(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'required|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chinh,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date',
            'loai_thong_ke' => 'required|in:khach_hang'
        ]);

        try {
            [$startDate, $endDate, $label] = $this->getDateRange($request);

            // Lấy dữ liệu gốc từ query
            $rawData = $this->getCustomerRawData($startDate, $endDate);

            // Tạo phan_bo_khach_hang
            $phanBoKhachHang = $rawData->map(function ($item) {
                return [
                    'hang_khach_hang' => $item['hang_khach_hang'],
                    'so_luong' => $item['so_luong'],
                    'ty_le' => $item['ty_le'],
                    'mau_sac' => $item['mau_sac']
                ];
            });

            // Tạo doanh_thu_theo_hang (đảm bảo có đủ 3 hạng)
            $doanhThuTheoHang = $this->ensureAllRanks($rawData->map(function ($item) {
                return [
                    'hang_khach_hang' => $item['hang_khach_hang'],
                    'doanh_thu' => $item['doanh_thu'],
                    'so_don_hang' => $item['so_don_hang'],
                    'gia_tri_trung_binh' => $item['gia_tri_trung_binh'],
                    'mau_sac' => $item['mau_sac']
                ];
            }));

            // Tạo chi_tiet_khach_hang (flat array, không nested)
            $chiTietKhachHang = $rawData->map(function ($item) {
                return [
                    'hang_khach_hang' => $item['hang_khach_hang'],
                    'so_luong' => $item['so_luong'],
                    'ty_le' => $item['ty_le'],
                    'tong_chi_tieu' => $item['doanh_thu'],
                    'chi_tieu_trung_binh' => $item['gia_tri_trung_binh'],
                    'so_don_hang' => $item['so_don_hang']
                ];
            });

            return response()->json([
                'data' => [
                    'phan_bo_khach_hang' => $phanBoKhachHang,
                    'doanh_thu_theo_hang' => $doanhThuTheoHang,
                    'chi_tiet_khach_hang' => $chiTietKhachHang
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function nhaCungCap(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'required|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date',
            'loai_thong_ke' => 'required|in:nha_cung_cap'
        ]);

        try {
            [$startDate, $endDate, $label] = $this->getDateRange($request);

            // Lấy dữ liệu nhập hàng từ nhà cung cấp với tỷ lệ giao đúng hạn
            $data = DB::table('suppliers')
                ->leftJoin('inventory_imports', function ($join) use ($startDate, $endDate) {
                    $join->on('suppliers.id', '=', 'inventory_imports.supplier_id')
                        ->whereBetween('inventory_imports.created_at', [$startDate, $endDate])
                        ->where('inventory_imports.status', 'completed');
                })
                ->select(
                    'suppliers.id',
                    'suppliers.name as ten_nha_cung_cap',
                    DB::raw('COUNT(inventory_imports.id) as so_don_nhap'),
                    DB::raw('COALESCE(SUM(inventory_imports.grand_total), 0) as tong_gia_tri'),
                    DB::raw('COALESCE(AVG(inventory_imports.grand_total), 0) as gia_tri_tb_don'),
                    // Tính số đơn giao đúng hạn: completed_at <= expected_at
                    DB::raw('SUM(CASE
                        WHEN inventory_imports.expected_at IS NOT NULL
                        AND inventory_imports.completed_at IS NOT NULL
                        AND inventory_imports.completed_at <= inventory_imports.expected_at
                        THEN 1
                        ELSE 0
                    END) as so_don_dung_han'),
                    // Tính số đơn có expected_at (để tính tỷ lệ)
                    DB::raw('SUM(CASE
                        WHEN inventory_imports.expected_at IS NOT NULL
                        THEN 1
                        ELSE 0
                    END) as so_don_co_han')
                )
                ->groupBy('suppliers.id', 'suppliers.name')
                ->having('so_don_nhap', '>', 0)
                ->orderByDesc('tong_gia_tri')
                ->get();

            // Tạo gia_tri_nhap_theo_ncc (cho biểu đồ)
            $giaTriNhapTheoNcc = $data->map(function ($item) {
                return [
                    'ten_nha_cung_cap' => $item->ten_nha_cung_cap,
                    'tong_gia_tri_nhap' => (int) round($item->tong_gia_tri),
                    'so_don_nhap' => (int) $item->so_don_nhap,
                    'gia_tri_tb_don' => (int) round($item->gia_tri_tb_don)
                ];
            });

            // Tạo chi_tiet_nha_cung_cap với đánh giá chính xác
            $chiTietNhaCungCap = $data->map(function ($item, $index) {
                // Tính tỷ lệ giao hàng đúng hạn
                $tyLeGiaoHang = 0;
                if ($item->so_don_co_han > 0) {
                    $tyLeGiaoHang = round(($item->so_don_dung_han / $item->so_don_co_han) * 100, 1);
                }

                // Đánh giá dựa trên tỷ lệ
                $danhGia = 'Trung bình';
                if ($tyLeGiaoHang >= 90) $danhGia = 'Tốt';
                elseif ($tyLeGiaoHang >= 70) $danhGia = 'Khá';

                return [
                    'stt' => $index + 1,
                    'ten_nha_cung_cap' => $item->ten_nha_cung_cap,
                    'so_don_nhap' => (int) $item->so_don_nhap,
                    'tong_gia_tri' => (int) round($item->tong_gia_tri),
                    'gia_tri_tb_don' => (int) round($item->gia_tri_tb_don),
                    'ty_le_giao_dung_han' => $tyLeGiaoHang,
                    'danh_gia' => $danhGia
                ];
            });

            return response()->json([
                'data' => [
                    'gia_tri_nhap_theo_ncc' => $giaTriNhapTheoNcc,
                    'chi_tiet_nha_cung_cap' => $chiTietNhaCungCap
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function nhanVien(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'required|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date',
            'loai_thong_ke' => 'required|in:nhan_vien'
        ]);

        try {
            [$startDate, $endDate, $label] = $this->getDateRange($request);

            // Lấy dữ liệu doanh số nhân viên (processed_by trong orders)
            $data = DB::table('users')
                ->join('orders', function ($join) use ($startDate, $endDate) {
                    $join->on('users.id', '=', 'orders.processed_by')
                        ->whereBetween('orders.created_at', [$startDate, $endDate])
                        ->whereIn('orders.status', ['completed', 'delivered']);
                })
                ->where('users.role', 'admin') // Chỉ lấy nhân viên/admin
                ->select(
                    'users.id',
                    'users.name as ten_nhan_vien',
                    DB::raw('COUNT(orders.id) as so_don'),
                    DB::raw('SUM(orders.grand_total) as doanh_so'),
                    DB::raw('AVG(orders.grand_total) as gia_tri_tb_don')
                )
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('doanh_so')
                ->get();

            // Tính tổng doanh số để tính hiệu suất
            $tongDoanhSo = $data->sum('doanh_so');

            // Tạo doanh_so_theo_nhan_vien
            $doanhSoTheoNhanVien = $data->map(function ($item) {
                return [
                    'ten_nhan_vien' => $item->ten_nhan_vien,
                    'doanh_so' => (int) round($item->doanh_so),
                    'so_don' => (int) $item->so_don,
                    'gia_tri_tb_don' => (int) round($item->gia_tri_tb_don)
                ];
            });

            // Tạo chi_tiet_nhan_vien với hiệu suất và xếp hạng
            $chiTietNhanVien = $data->map(function ($item, $index) use ($tongDoanhSo) {
                // Tính hiệu suất (% đóng góp vào tổng doanh số)
                $hieuSuat = 0;
                if ($tongDoanhSo > 0) {
                    $hieuSuat = round(($item->doanh_so / $tongDoanhSo) * 100, 1);
                }

                return [
                    'stt' => $index + 1,
                    'ten_nhan_vien' => $item->ten_nhan_vien,
                    'doanh_so' => (int) round($item->doanh_so),
                    'so_don' => (int) $item->so_don,
                    'gia_tri_tb_don' => (int) round($item->gia_tri_tb_don),
                    'hieu_suat' => $hieuSuat,
                    'xep_hang' => 'Top ' . ($index + 1)
                ];
            });

            return response()->json([
                'data' => [
                    'doanh_so_theo_nhan_vien' => $doanhSoTheoNhanVien,
                    'chi_tiet_nhan_vien' => $chiTietNhanVien
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function baoHanh(Request $request)
    {
        $request->validate([
            'loai_thoi_gian' => 'required|in:hom_nay,tuan_nay,thang_nay,quy_nay,nam_nay,tuy_chon',
            'tu_ngay' => 'nullable|date',
            'den_ngay' => 'nullable|date',
            'loai_thong_ke' => 'required|in:bao_hanh'
        ]);

        try {
            [$startDate, $endDate, $label] = $this->getDateRange($request);

            // Lấy dữ liệu bảo hành theo tháng
            $warranties = DB::table('warranties')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->select(
                    DB::raw('YEAR(created_at) as nam'),
                    DB::raw('MONTH(created_at) as thang'),
                    DB::raw('COUNT(*) as tiep_nhan'),
                    DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as hoan_thanh'),
                    DB::raw('SUM(CASE WHEN status IN ("pending", "processing", "repaired", "waiting_for_customer") THEN 1 ELSE 0 END) as dang_xu_ly')
                )
                ->groupBy('nam', 'thang')
                ->orderBy('nam')
                ->orderBy('thang')
                ->get();

            // Tạo bieu_do_theo_thang
            $bieuDoTheoThang = $warranties->map(function ($item) {
                return [
                    'thang' => 'T' . $item->thang,
                    'tiep_nhan' => (int) $item->tiep_nhan,
                    'hoan_thanh' => (int) $item->hoan_thanh,
                    'dang_xu_ly' => (int) $item->dang_xu_ly
                ];
            });

            // Tạo chi_tiet_theo_thang với tỷ lệ hoàn thành
            $chiTietTheoThang = $warranties->map(function ($item) {
                $tyLe = 0;
                if ($item->tiep_nhan > 0) {
                    $tyLe = round(($item->hoan_thanh / $item->tiep_nhan) * 100, 1);
                }

                return [
                    'thang' => 'T' . $item->thang,
                    'tiep_nhan' => (int) $item->tiep_nhan,
                    'hoan_thanh' => (int) $item->hoan_thanh,
                    'dang_xu_ly' => (int) $item->dang_xu_ly,
                    'ty_le' => $tyLe
                ];
            });

            return response()->json([
                'data' => [
                    'bieu_do_theo_thang' => $bieuDoTheoThang,
                    'chi_tiet_theo_thang' => $chiTietTheoThang
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi xử lý: ' . $e->getMessage()], 500);
        }
    }

    public function baoHanhStats()
    {
        try {
            $tongSoDon = Warranty::count();
            $tongDaTiepNhan = Warranty::where('status', 'pending')->count();
            $tongDonDaGuiNCC = Warranty::where('status', 'processing')->count();
            $tongDonNSXDaTra = Warranty::where('status', 'repaired')->count();
            $tongDonHoanThanh = Warranty::whereIn('status', ['completed', 'returned'])->count();

            return response()->json([
                'data' => [
                    'tong_so_don_bao_hanh' => $tongSoDon,
                    'tong_da_tiep_nhan' => $tongDaTiepNhan,
                    'tong_don_da_gui_ncc' => $tongDonDaGuiNCC,
                    'tong_don_nha_san_xuat_da_tra' => $tongDonNSXDaTra,
                    'tong_don_hoan_thanh_tra' => $tongDonHoanThanh
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê bảo hành',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function khachHangStats()
    {
        try {
            // 1. Tổng số khách hàng
            $tongSoKhachHang = User::where('role', 'customer')->count();

            // 2. Khách hàng tăng trong 30 ngày
            $khachHangTang30Ngay = User::where('role', 'customer')
                ->where('created_at', '>=', Carbon::now()->subDays(30))
                ->count();

            // 3. Tổng khách VIP (loyalty_tier != 'standard')
            $tongKhachVip = User::where('role', 'customer')
                ->where('loyalty_tier', '!=', 'standard')
                ->count();

            // 4. Phần trăm khách VIP
            $phanTramKhachVip = $tongSoKhachHang > 0 ? ($tongKhachVip / $tongSoKhachHang) * 100 : 0;

            // 5. Tổng doanh thu
            $tongDoanhThu = Order::where('status', 'completed')->sum('grand_total');

            return response()->json([
                'data' => [
                    'tong_so_khach_hang' => $tongSoKhachHang,
                    'khach_hang_tang_trong_30_ngay' => $khachHangTang30Ngay,
                    'tong_khach_vip' => $tongKhachVip,
                    'phan_tram_khach_vip' => round($phanTramKhachVip, 1),
                    'tong_doanh_thu' => (float) $tongDoanhThu
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê khách hàng',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function khuyenMaiStats()
    {
        try {
            // Số lượng khuyến mãi của Winform/POS (lọc theo channels)
            $soLuong = Promotion::where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('channels')
                        ->orWhere('channels', '[]')
                        ->orWhere('channels', 'null')
                        ->orWhereJsonContains('channels', 'pos')
                        ->orWhereJsonContains('channels', 'offline')
                        ->orWhereJsonContains('channels', 'winform')
                        ->orWhereJsonContains('channels', 'all');
                })
                ->count();

            // Tổng giá trị khuyến mãi (số chương trình)
            $tongGiaTri = $soLuong;

            // Tổng giá trị đã sử dụng (tổng tiền đã giảm) - CHỈ TỪ WINFORM/POS
            $tongDaDung = Order::where('channel', 'pos')->sum('discount_total');

            return response()->json([
                'data' => [
                    'so_luong_khuyen_mai' => $soLuong,
                    'tong_gia_tri_khuyen_mai' => $tongGiaTri,
                    'tong_gia_tri_khuyen_mai_da_dung' => (float) $tongDaDung
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê khuyến mãi',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function nhaCungCapStats()
    {
        try {
            // 1. Tổng số nhà cung cấp
            $soLuongNCC = DB::table('suppliers')->count();

            // 2. Số NCC còn hoạt động
            $soNCCHoatDong = DB::table('suppliers')->where('is_active', true)->count();

            // 3. Phần trăm NCC hoạt động
            $phanTramHoatDong = $soLuongNCC > 0 ? ($soNCCHoatDong / $soLuongNCC) * 100 : 0;

            // 4. Tổng giá trị nhập (sử dụng grand_total từ inventory_imports)
            $tongGiaTriNhap = DB::table('inventory_imports')
                ->where('status', 'completed')
                ->sum('grand_total');

            return response()->json([
                'data' => [
                    'so_luong_ncc' => $soLuongNCC,
                    'so_ncc_con_hoat_dong' => $soNCCHoatDong,
                    'phan_tram_ncc_hoat_dong' => round($phanTramHoatDong, 1),
                    'tong_gia_tri_nhap' => (float) $tongGiaTriNhap
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('nhaCungCapStats error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê nhà cung cấp',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function nhanVienStats()
    {
        try {
            // 1. Tổng nhân viên (admin + staff)
            $tongNhanVien = User::whereIn('role', ['admin', 'staff'])->count();

            // 2. Tổng đơn đã xử lý (completed)
            $tongDonDaXuLy = Order::where('status', 'completed')->count();

            // 3. Số nhân viên hoạt động
            $soNVHoatDong = User::whereIn('role', ['admin', 'staff'])
                ->where('is_active', true)
                ->count();

            // 4. Phần trăm nhân viên hoạt động
            $phanTram = $tongNhanVien > 0 ? ($soNVHoatDong / $tongNhanVien) * 100 : 0;

            return response()->json([
                'data' => [
                    'tong_nhan_vien' => $tongNhanVien,
                    'tong_don_da_xu_ly' => $tongDonDaXuLy,
                    'so_nhan_vien_hoat_dong' => $soNVHoatDong,
                    'phan_tram_nhan_vien_hoat_dong' => round($phanTram, 1)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê nhân viên',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function nhapHangStats()
    {
        try {
            // 1. Tổng giá trị nhập (sử dụng grand_total từ inventory_imports đã hoàn thành)
            $tongGiaTriNhap = DB::table('inventory_imports')
                ->where('status', 'completed')
                ->sum('grand_total');

            // 2. Đơn đang chờ giao (pending, processing)
            $donDangChoGiao = DB::table('inventory_imports')
                ->whereIn('status', ['pending', 'processing'])
                ->count();

            // 3. Tổng đơn nhập
            $tongDonNhap = DB::table('inventory_imports')->count();

            // 4. Sản phẩm sắp hết (quantity < 20)
            $soSanPhamSapHet = DB::table('products')
                ->where('quantity', '<', 20)
                ->where('quantity', '>', 0)
                ->count();

            return response()->json([
                'data' => [
                    'tong_gia_tri_nhap' => (float) $tongGiaTriNhap,
                    'don_dang_cho_giao' => $donDangChoGiao,
                    'tong_don_nhap' => $tongDonNhap,
                    'so_san_pham_sap_het' => $soSanPhamSapHet
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi khi lấy thống kê nhập hàng',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getDateRange($request)
    {
        $now = Carbon::now();

        switch ($request->loai_thoi_gian) {
            case 'hom_nay':
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'Hôm nay'];
            case 'tuan_nay':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek(), 'Tuần này'];
            case 'thang_nay':
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), 'Tháng này'];
            case 'quy_nay':
                return [$now->copy()->startOfQuarter(), $now->copy()->endOfQuarter(), 'Quý này'];
            case 'nam_nay':
                return [$now->copy()->startOfYear(), $now->copy()->endOfYear(), 'Năm này'];
            case 'tuy_chinh':
            case 'tuy_chon':
                return [
                    Carbon::parse($request->tu_ngay)->startOfDay(),
                    Carbon::parse($request->den_ngay)->endOfDay(),
                    'Tùy chỉnh'
                ];
            default:
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), 'Tháng này'];
        }
    }

    private function getTongQuat($startDate, $endDate, $label)
    {
        // Đơn hàng đã hoàn thành trong kỳ
        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'delivered'])
            ->get();

        $tongDoanhThu = $orders->sum('grand_total');
        $soDonHang = $orders->count();

        // Tính lợi nhuận (giá bán - giá gốc)
        $tongLoiNhuan = 0;
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                if ($item->product) {
                    $loiNhuan = ($item->unit_price - ($item->product->original_price ?? $item->unit_price * 0.7)) * $item->quantity;
                    $tongLoiNhuan += $loiNhuan;
                }
            }
        }

        // So sánh với kỳ trước
        $prevStart = $startDate->copy()->sub($endDate->diffInDays($startDate), 'days');
        $prevEnd = $startDate->copy()->subDay();
        $prevOrders = Order::whereBetween('created_at', [$prevStart, $prevEnd])
            ->whereIn('status', ['completed', 'delivered'])
            ->count();

        $tyLeDonHang = $prevOrders > 0 ? (($soDonHang - $prevOrders) / $prevOrders) * 100 : 0;

        // Khách hàng mới
        $khachHangMoi = User::whereBetween('created_at', [$startDate, $endDate])
            ->where('role', 'customer')
            ->count();

        $prevKhachHang = User::whereBetween('created_at', [$prevStart, $prevEnd])
            ->where('role', 'customer')
            ->count();

        $tyLeKhachHangMoi = $prevKhachHang > 0 ? (($khachHangMoi - $prevKhachHang) / $prevKhachHang) * 100 : 0;

        return [
            'tong_doanh_thu' => round($tongDoanhThu),
            'thoi_gian_doanh_thu' => $label,
            'tong_loi_nhuan' => round($tongLoiNhuan),
            'ty_le_loi_nhuan' => $tongDoanhThu > 0 ? round(($tongLoiNhuan / $tongDoanhThu) * 100, 1) : 0,
            'so_don_hang' => $soDonHang,
            'ty_le_don_hang' => round($tyLeDonHang, 1),
            'khach_hang_moi' => $khachHangMoi,
            'ty_le_khach_hang_moi' => round($tyLeKhachHangMoi, 1)
        ];
    }

    private function getBieuDoThang($startDate, $endDate, $loaiThoiGian)
    {
        // Chọn format và group by theo loại thời gian
        switch ($loaiThoiGian) {
            case 'hom_nay':
            case 'tuan_nay':
            case 'thang_nay':
                // Group theo NGÀY
                $dateFormat = '%d/%m';
                $groupBy = "DATE_FORMAT(orders.created_at, '{$dateFormat}')";
                $orderBy = 'DATE(orders.created_at)';
                break;
            case 'quy_nay':
            case 'nam_nay':
            case 'tuy_chinh':
            case 'tuy_chon':
            default:
                // Group theo THÁNG
                $dateFormat = 'T%c/%Y';
                $groupBy = "DATE_FORMAT(orders.created_at, '{$dateFormat}')";
                $orderBy = 'YEAR(orders.created_at), MONTH(orders.created_at)';
                break;
        }

        $data = DB::table('orders')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->whereNull('orders.deleted_at')
            ->selectRaw("
                DATE_FORMAT(orders.created_at, '{$dateFormat}') as thang,
                SUM(order_items.line_total) as doanh_thu,
                SUM(order_items.quantity * (order_items.unit_price - COALESCE(products.original_price, order_items.unit_price * 0.7))) as loi_nhuan
            ")
            ->groupByRaw($groupBy)
            ->orderByRaw($orderBy)
            ->get();

        return $data->map(function ($item) {
            return [
                'thang' => $item->thang,
                'doanh_thu' => round($item->doanh_thu),
                'loi_nhuan' => round($item->loi_nhuan)
            ];
        })->toArray();
    }

    private function getDoanhThuSanPham($startDate, $endDate)
    {
        $colors = ['#4E8EF6', '#9B59B6', '#1ABC9C', '#F39C12', '#E74C3C', '#3498DB'];

        $data = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->select('categories.name as ten_danh_muc', DB::raw('SUM(order_items.line_total) as doanh_thu'))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('doanh_thu')
            ->get();

        $tongDoanhThu = $data->sum('doanh_thu');
        $result = [];

        foreach ($data as $index => $item) {
            $result[] = [
                'ten_danh_muc' => $item->ten_danh_muc,
                'doanh_thu' => round($item->doanh_thu),
                'ty_le' => $tongDoanhThu > 0 ? round(($item->doanh_thu / $tongDoanhThu) * 100, 1) : 0,
                'mau_sac' => $colors[$index % count($colors)]
            ];
        }

        return $result;
    }

    private function getChiTietThang($startDate, $endDate, $loaiThoiGian)
    {
        // Chọn format và group by theo loại thời gian
        switch ($loaiThoiGian) {
            case 'hom_nay':
            case 'tuan_nay':
            case 'thang_nay':
                // Group theo NGÀY
                $dateFormat = '%d/%m/%Y';
                $groupBy = "DATE_FORMAT(orders.created_at, '{$dateFormat}')";
                $orderBy = 'DATE(orders.created_at)';
                break;
            case 'quy_nay':
            case 'nam_nay':
            case 'tuy_chinh':
            case 'tuy_chon':
            default:
                // Group theo THÁNG
                $dateFormat = 'T%c/%Y';
                $groupBy = "DATE_FORMAT(orders.created_at, '{$dateFormat}')";
                $orderBy = 'YEAR(orders.created_at), MONTH(orders.created_at)';
                break;
        }

        $data = DB::table('orders')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->whereNull('orders.deleted_at')
            ->selectRaw("
                DATE_FORMAT(orders.created_at, '{$dateFormat}') as thang,
                SUM(order_items.line_total) as doanh_thu,
                SUM(order_items.quantity * (order_items.unit_price - COALESCE(products.original_price, order_items.unit_price * 0.7))) as loi_nhuan,
                COUNT(DISTINCT orders.id) as so_don,
                AVG(orders.grand_total) as gia_tri_trung_binh
            ")
            ->groupByRaw($groupBy)
            ->orderByRaw($orderBy)
            ->get();

        return $data->map(function ($item) {
            return [
                'thang' => $item->thang,
                'doanh_thu' => round($item->doanh_thu),
                'loi_nhuan' => round($item->loi_nhuan),
                'so_don' => $item->so_don,
                'gia_tri_trung_binh' => round($item->gia_tri_trung_binh),
                'ty_suat_loi_nhuan' => $item->doanh_thu > 0 ? round($item->loi_nhuan / $item->doanh_thu, 2) : 0
            ];
        })->toArray();
    }

    private function getTopSanPhamBanChay($startDate, $endDate)
    {
        $data = DB::table('orders')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->selectRaw("
                products.name as ten_san_pham,
                SUM(order_items.quantity) as so_luong_ban,
                SUM(order_items.line_total) as doanh_thu
            ")
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('so_luong_ban')
            ->limit(10)
            ->get();

        $tongSoLuong = $data->sum('so_luong_ban');

        return $data->map(function ($item) use ($tongSoLuong) {
            return [
                'ten_san_pham' => $item->ten_san_pham,
                'so_luong_ban' => (int) $item->so_luong_ban,
                'doanh_thu' => (int) round($item->doanh_thu),
                'ty_le' => $tongSoLuong > 0 ? round(($item->so_luong_ban / $tongSoLuong) * 100, 2) : 0
            ];
        })->toArray();
    }

    private function getDoanhThuTheoSanPham2($startDate, $endDate)
    {
        $colors = ['#9B59B6', '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#1ABC9C'];

        $data = DB::table('orders')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->selectRaw("
                products.name as ten_san_pham,
                SUM(order_items.line_total) as doanh_thu
            ")
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('doanh_thu')
            ->limit(6)
            ->get();

        $tongDoanhThu = $data->sum('doanh_thu');

        return $data->map(function ($item, $index) use ($colors, $tongDoanhThu) {
            return [
                'ten_san_pham' => $item->ten_san_pham,
                'doanh_thu' => (int) round($item->doanh_thu),
                'ty_le' => $tongDoanhThu > 0 ? round(($item->doanh_thu / $tongDoanhThu) * 100, 2) : 0,
                'mau_sac' => $colors[$index % count($colors)]
            ];
        })->toArray();
    }

    private function getChiTietSanPham($startDate, $endDate)
    {
        $data = DB::table('products')
            ->leftJoin('order_items', function ($join) use ($startDate, $endDate) {
                $join->on('products.id', '=', 'order_items.product_id');
            })
            ->leftJoin('orders', function ($join) use ($startDate, $endDate) {
                $join->on('order_items.order_id', '=', 'orders.id')
                    ->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->whereIn('orders.status', ['completed', 'delivered']);
            })
            ->selectRaw("
                products.id,
                products.name as ten_san_pham,
                COALESCE(SUM(order_items.quantity), 0) as da_ban,
                COALESCE(SUM(order_items.line_total), 0) as doanh_thu,
                CASE
                    WHEN SUM(order_items.quantity) > 0 THEN SUM(order_items.line_total) / SUM(order_items.quantity)
                    ELSE products.price
                END as gia_tb,
                products.quantity as ton_kho,
                CASE
                    WHEN products.quantity < 50 THEN 'Sắp hết'
                    ELSE 'Đủ hàng'
                END as trang_thai
            ")
            ->groupBy('products.id', 'products.name', 'products.price', 'products.quantity')
            ->orderByDesc('da_ban')
            ->limit(50)
            ->get();

        return $data->map(function ($item, $index) {
            return [
                'stt' => $index + 1,
                'ten_san_pham' => $item->ten_san_pham,
                'da_ban' => (int) $item->da_ban,
                'doanh_thu' => (int) round($item->doanh_thu),
                'gia_tb' => (int) round($item->gia_tb),
                'ton_kho' => (int) $item->ton_kho,
                'trang_thai' => $item->trang_thai
            ];
        })->toArray();
    }

    private function getTongQuatTonKho()
    {
        $products = DB::table('products')->get();

        $tongSanPhamTon = $products->sum('quantity');
        $giaTriTonKho = $products->sum(function ($product) {
            return $product->quantity * ($product->original_price ?? $product->price * 0.7);
        });

        $sanPhamSapHet = $products->where('quantity', '>', 0)->where('quantity', '<=', 20)->count();

        // Sản phẩm tồn chậm: không bán trong 90 ngày
        $ngay90TruocDay = Carbon::now()->subDays(90);
        $sanPhamTonCham = DB::table('products')
            ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('orders', function ($join) use ($ngay90TruocDay) {
                $join->on('order_items.order_id', '=', 'orders.id')
                    ->where('orders.created_at', '>=', $ngay90TruocDay)
                    ->whereIn('orders.status', ['completed', 'delivered']);
            })
            ->whereNull('orders.id')
            ->where('products.quantity', '>', 0)
            ->count();

        return [
            'tong_san_pham_ton' => (int) $tongSanPhamTon,
            'gia_tri_ton_kho' => (int) round($giaTriTonKho),
            'san_pham_sap_het' => (int) $sanPhamSapHet,
            'san_pham_ton_cham' => (int) $sanPhamTonCham
        ];
    }

    private function getTonKhoTheoDanhMuc()
    {
        $colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

        // Sử dụng subquery để tránh cartesian product khi join nhiều bảng
        // 1. Tính tổng tồn kho và giá trị tồn theo danh mục từ bảng products
        $productStats = DB::table('products')
            ->selectRaw("
                category_id,
                SUM(quantity) as so_luong_ton,
                SUM(quantity * COALESCE(original_price, price * 0.7)) as gia_tri_ton
            ")
            ->whereNull('deleted_at')
            ->groupBy('category_id');

        // 2. Tính tổng nhập kho theo danh mục (chỉ từ phiếu completed)
        $importStats = DB::table('inventory_import_items')
            ->join('products', 'inventory_import_items.product_id', '=', 'products.id')
            ->join('inventory_imports', 'inventory_import_items.inventory_import_id', '=', 'inventory_imports.id')
            ->where('inventory_imports.status', 'completed')
            ->selectRaw("
                products.category_id,
                SUM(inventory_import_items.quantity) as tong_nhap_kho
            ")
            ->groupBy('products.category_id');

        // 3. Kết hợp dữ liệu
        $data = DB::table('categories')
            ->leftJoinSub($productStats, 'ps', 'categories.id', '=', 'ps.category_id')
            ->leftJoinSub($importStats, 'is', 'categories.id', '=', 'is.category_id')
            ->selectRaw("
                categories.name as ten_danh_muc,
                COALESCE(ps.so_luong_ton, 0) as so_luong_ton,
                COALESCE(is.tong_nhap_kho, 0) as tong_nhap_kho,
                COALESCE(ps.gia_tri_ton, 0) as gia_tri_ton
            ")
            ->orderByDesc('gia_tri_ton')
            ->get();

        $tongGiaTriTon = $data->sum('gia_tri_ton');

        return $data->map(function ($item, $index) use ($colors, $tongGiaTriTon) {
            // Nếu có dữ liệu nhập kho thì dùng, không thì tính = tồn hiện tại (fallback)
            $tongNhap = $item->tong_nhap_kho > 0
                ? $item->tong_nhap_kho
                : $item->so_luong_ton;

            return [
                'ten_danh_muc' => $item->ten_danh_muc,
                'tong_nhap' => (int) $tongNhap,
                'so_luong_ton' => (int) $item->so_luong_ton,
                'gia_tri_ton' => (int) round($item->gia_tri_ton),
                'ty_le' => $tongGiaTriTon > 0 ? round(($item->gia_tri_ton / $tongGiaTriTon) * 100, 1) : 0,
                'mau_sac' => $colors[$index % count($colors)]
            ];
        })->toArray();
    }

    private function getChiTietTonKho()
    {
        $ngay90TruocDay = Carbon::now()->subDays(90);

        $data = DB::table('products')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->leftJoin('inventory_import_items', 'products.id', '=', 'inventory_import_items.product_id')
            ->leftJoin('inventory_imports', 'inventory_import_items.inventory_import_id', '=', 'inventory_imports.id')
            ->leftJoin(DB::raw('(SELECT product_id, MAX(orders.created_at) as ngay_ban_gan_nhat
                FROM order_items
                JOIN orders ON order_items.order_id = orders.id
                WHERE orders.status IN ("completed", "delivered")
                GROUP BY product_id) as last_sale'), 'products.id', '=', 'last_sale.product_id')
            ->selectRaw("
                products.id,
                products.name as ten_san_pham,
                categories.name as danh_muc,
                products.quantity as ton_kho,
                COALESCE(products.original_price, products.price * 0.7) as gia_nhap,
                products.price as gia_ban,
                products.quantity * COALESCE(products.original_price, products.price * 0.7) as gia_tri_ton,
                MAX(inventory_imports.created_at) as ngay_nhap_gan_nhat,
                last_sale.ngay_ban_gan_nhat,
                CASE
                    WHEN products.quantity = 0 THEN 'Hết hàng'
                    WHEN products.quantity <= 20 THEN 'Sắp hết'
                    WHEN last_sale.ngay_ban_gan_nhat IS NULL OR last_sale.ngay_ban_gan_nhat < ? THEN 'Tồn chậm'
                    ELSE 'Đủ hàng'
                END as trang_thai
            ", [$ngay90TruocDay])
            ->groupBy('products.id', 'products.name', 'categories.name', 'products.quantity',
                     'products.original_price', 'products.price', 'last_sale.ngay_ban_gan_nhat')
            ->orderByDesc('gia_tri_ton')
            ->limit(100)
            ->get();

        return $data->map(function ($item, $index) {
            return [
                'stt' => $index + 1,
                'ten_san_pham' => $item->ten_san_pham,
                'danh_muc' => $item->danh_muc,
                'ton_kho' => (int) $item->ton_kho,
                'gia_nhap' => (int) round($item->gia_nhap),
                'gia_ban' => (int) round($item->gia_ban),
                'gia_tri_ton' => (int) round($item->gia_tri_ton),
                'ngay_nhap_gan_nhat' => $item->ngay_nhap_gan_nhat ? Carbon::parse($item->ngay_nhap_gan_nhat)->format('d/m') : null,
                'trang_thai' => $item->trang_thai
            ];
        })->toArray();
    }

    private function getCustomerRawData($startDate, $endDate)
    {
        $colors = ['#9b59b6', '#3498db', '#e74c3c'];

        // Bước 1: Tính tổng chi tiêu của từng user
        $users = DB::table('users')
            ->leftJoin('orders', function ($join) use ($startDate, $endDate) {
                $join->on('users.id', '=', 'orders.user_id')
                    ->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->whereIn('orders.status', ['completed', 'delivered']);
            })
            ->where('users.role', 'customer')
            ->select(
                'users.id',
                DB::raw('COUNT(orders.id) as so_don_hang'),
                DB::raw('SUM(orders.grand_total) as tong_chi_tieu'),
                DB::raw('AVG(orders.grand_total) as gia_tri_trung_binh')
            )
            ->groupBy('users.id')
            ->get();
        // Không filter, tính cả khách không có đơn hàng

        // Bước 2: Phân loại hạng và gom nhóm
        $grouped = $users->groupBy(function ($user) {
            if ($user->tong_chi_tieu >= 50000000) return 'VIP Kim cương';
            if ($user->tong_chi_tieu >= 20000000) return 'VIP Vàng';
            return 'Thường';
        });

        $tongKhachHang = $users->count();

        // Bước 3: Tính toán cho từng hạng
        return collect(['VIP Kim cương', 'VIP Vàng', 'Thường'])->map(function ($hang, $index) use ($grouped, $tongKhachHang, $colors) {
            $group = $grouped->get($hang, collect());
            $soLuong = $group->count();

            return [
                'hang_khach_hang' => $hang,
                'so_luong' => $soLuong,
                'ty_le' => $tongKhachHang > 0 ? round(($soLuong / $tongKhachHang) * 100, 1) : 0,
                'doanh_thu' => (int) round($group->sum('tong_chi_tieu')),
                'so_don_hang' => (int) $group->sum('so_don_hang'),
                'gia_tri_trung_binh' => $soLuong > 0 ? (int) round($group->sum('tong_chi_tieu') / $soLuong) : 0,
                'mau_sac' => $colors[$index % count($colors)]
            ];
        });
    }

    private function ensureAllRanks($data)
    {
        // Đảm bảo có đủ 3 hạng, nếu thiếu thì thêm vào với giá trị 0
        $ranks = ['VIP Kim cương', 'VIP Vàng', 'Thường'];
        $existing = $data->pluck('hang_khach_hang')->toArray();
        $colors = ['#9b59b6', '#3498db', '#e74c3c'];

        foreach ($ranks as $index => $rank) {
            if (!in_array($rank, $existing)) {
                $data->push([
                    'hang_khach_hang' => $rank,
                    'doanh_thu' => 0,
                    'so_don_hang' => 0,
                    'gia_tri_trung_binh' => 0,
                    'mau_sac' => $colors[$index]
                ]);
            }
        }

        return $data->values();
    }

    private function getTongQuatDashboard($startDate, $endDate)
    {
        // Tính kỳ trước
        $diff = $startDate->diffInDays($endDate);
        $prevStart = $startDate->copy()->subDays($diff + 1);
        $prevEnd = $startDate->copy()->subDay();

        // Doanh thu kỳ này
        $doanhThuKyNay = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'delivered'])
            ->sum('grand_total');

        // Doanh thu kỳ trước
        $doanhThuKyTruoc = Order::whereBetween('created_at', [$prevStart, $prevEnd])
            ->whereIn('status', ['completed', 'delivered'])
            ->sum('grand_total');

        $tyLeDoanhThu = 0;
        if ($doanhThuKyTruoc > 0) {
            $tyLeDoanhThu = round((($doanhThuKyNay - $doanhThuKyTruoc) / $doanhThuKyTruoc) * 100, 1);
        }

        // Đơn hàng
        $donHangKyNay = Order::whereBetween('created_at', [$startDate, $endDate])->count();
        $donHangKyTruoc = Order::whereBetween('created_at', [$prevStart, $prevEnd])->count();
        $tyLeDonHang = 0;
        if ($donHangKyTruoc > 0) {
            $tyLeDonHang = round((($donHangKyNay - $donHangKyTruoc) / $donHangKyTruoc) * 100, 1);
        }

        // Sản phẩm
        $tongSanPham = DB::table('products')->count();
        $tyLeSanPham = 0;

        // Khách hàng
        $khachHangKyNay = User::where('role', 'customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
        $khachHangKyTruoc = User::where('role', 'customer')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->count();
        $tyLeKhachHang = 0;
        if ($khachHangKyTruoc > 0) {
            $tyLeKhachHang = round((($khachHangKyNay - $khachHangKyTruoc) / $khachHangKyTruoc) * 100, 1);
        }

        return [
            'tong_doanh_thu' => (int) round($doanhThuKyNay),
            'ty_le_doanh_thu' => $tyLeDoanhThu,
            'tong_don_hang' => $donHangKyNay,
            'ty_le_don_hang' => $tyLeDonHang,
            'tong_san_pham' => $tongSanPham,
            'ty_le_san_pham' => $tyLeSanPham,
            'tong_khach_hang' => User::where('role', 'customer')->count(),
            'ty_le_khach_hang' => $tyLeKhachHang
        ];
    }

    private function getDoanhThuTheoThang()
    {
        $data = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $doanhThu = Order::whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->whereIn('status', ['completed', 'delivered'])
                ->sum('grand_total');

            $data[] = [
                'thang' => 'T' . $date->month,
                'doanh_thu' => (int) round($doanhThu)
            ];
        }
        return $data;
    }

    private function getDoanhSoTuanNay()
    {
        $data = [];
        $ngayTrongTuan = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::now()->startOfWeek()->addDays($i);
            $startOfDay = $date->copy()->startOfDay();
            $endOfDay = $date->copy()->endOfDay();

            $doanhSo = Order::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->whereIn('status', ['completed', 'delivered'])
                ->sum('grand_total');

            $data[] = [
                'ngay' => $ngayTrongTuan[$i],
                'doanh_so' => (int) round($doanhSo)
            ];
        }
        return $data;
    }

    private function getPhanBoSanPham()
    {
        $data = DB::table('products')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.name as danh_muc',
                DB::raw('COUNT(products.id) as so_luong')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('so_luong')
            ->get();

        $tongSanPham = $data->sum('so_luong');

        return $data->map(function ($item) use ($tongSanPham) {
            $tyLe = 0;
            if ($tongSanPham > 0) {
                $tyLe = round(($item->so_luong / $tongSanPham) * 100);
            }
            return [
                'danh_muc' => $item->danh_muc,
                'ty_le' => $tyLe,
                'so_luong' => (int) $item->so_luong
            ];
        })->toArray();
    }

    private function getTopSanPham30Ngay()
    {
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        $data = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->select(
                'products.id',
                'products.name as ten_san_pham',
                'products.quantity as ton_kho',
                DB::raw('SUM(order_items.quantity) as da_ban'),
                DB::raw('SUM(order_items.line_total) as doanh_thu')
            )
            ->groupBy('products.id', 'products.name', 'products.quantity')
            ->orderByDesc('da_ban')
            ->limit(10)
            ->get();

        return $data->map(function ($item, $index) {
            return [
                'stt' => $index + 1,
                'ten_san_pham' => $item->ten_san_pham,
                'da_ban' => (int) $item->da_ban,
                'doanh_thu' => (int) round($item->doanh_thu),
                'ton_kho' => (int) $item->ton_kho
            ];
        })->toArray();
    }
}
