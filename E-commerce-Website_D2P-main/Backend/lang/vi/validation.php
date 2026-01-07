<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines - Tiếng Việt
    |--------------------------------------------------------------------------
    */

    'accepted' => ':attribute phải được chấp nhận.',
    'accepted_if' => ':attribute phải được chấp nhận khi :other là :value.',
    'active_url' => ':attribute không phải là URL hợp lệ.',
    'after' => ':attribute phải là ngày sau :date.',
    'after_or_equal' => ':attribute phải là ngày sau hoặc bằng :date.',
    'alpha' => ':attribute chỉ được chứa chữ cái.',
    'alpha_dash' => ':attribute chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới.',
    'alpha_num' => ':attribute chỉ được chứa chữ cái và số.',
    'array' => ':attribute phải là một mảng.',
    'before' => ':attribute phải là ngày trước :date.',
    'before_or_equal' => ':attribute phải là ngày trước hoặc bằng :date.',
    'between' => [
        'array' => ':attribute phải có từ :min đến :max phần tử.',
        'file' => ':attribute phải có kích thước từ :min đến :max kilobytes.',
        'numeric' => ':attribute phải có giá trị từ :min đến :max.',
        'string' => ':attribute phải có độ dài từ :min đến :max ký tự.',
    ],
    'boolean' => ':attribute phải là true hoặc false.',
    'confirmed' => 'Xác nhận :attribute không khớp.',
    'current_password' => 'Mật khẩu không đúng.',
    'date' => ':attribute không phải là ngày hợp lệ.',
    'date_equals' => ':attribute phải là ngày bằng :date.',
    'date_format' => ':attribute không khớp với định dạng :format.',
    'decimal' => ':attribute phải có :decimal chữ số thập phân.',
    'declined' => ':attribute phải bị từ chối.',
    'declined_if' => ':attribute phải bị từ chối khi :other là :value.',
    'different' => ':attribute và :other phải khác nhau.',
    'digits' => ':attribute phải có :digits chữ số.',
    'digits_between' => ':attribute phải có từ :min đến :max chữ số.',
    'dimensions' => ':attribute có kích thước ảnh không hợp lệ.',
    'distinct' => ':attribute có giá trị trùng lặp.',
    'doesnt_end_with' => ':attribute không được kết thúc bằng một trong các giá trị sau: :values.',
    'doesnt_start_with' => ':attribute không được bắt đầu bằng một trong các giá trị sau: :values.',
    'email' => ':attribute phải là địa chỉ email hợp lệ.',
    'ends_with' => ':attribute phải kết thúc bằng một trong các giá trị sau: :values.',
    'enum' => ':attribute đã chọn không hợp lệ.',
    'exists' => ':attribute đã chọn không hợp lệ.',
    'file' => ':attribute phải là một tệp tin.',
    'filled' => ':attribute phải có giá trị.',
    'gt' => [
        'array' => ':attribute phải có nhiều hơn :value phần tử.',
        'file' => ':attribute phải lớn hơn :value kilobytes.',
        'numeric' => ':attribute phải lớn hơn :value.',
        'string' => ':attribute phải dài hơn :value ký tự.',
    ],
    'gte' => [
        'array' => ':attribute phải có :value phần tử trở lên.',
        'file' => ':attribute phải lớn hơn hoặc bằng :value kilobytes.',
        'numeric' => ':attribute phải lớn hơn hoặc bằng :value.',
        'string' => ':attribute phải dài hơn hoặc bằng :value ký tự.',
    ],
    'image' => ':attribute phải là một ảnh.',
    'in' => ':attribute đã chọn không hợp lệ.',
    'in_array' => ':attribute không tồn tại trong :other.',
    'integer' => ':attribute phải là số nguyên.',
    'ip' => ':attribute phải là địa chỉ IP hợp lệ.',
    'ipv4' => ':attribute phải là địa chỉ IPv4 hợp lệ.',
    'ipv6' => ':attribute phải là địa chỉ IPv6 hợp lệ.',
    'json' => ':attribute phải là chuỗi JSON hợp lệ.',
    'lowercase' => ':attribute phải là chữ thường.',
    'lt' => [
        'array' => ':attribute phải có ít hơn :value phần tử.',
        'file' => ':attribute phải nhỏ hơn :value kilobytes.',
        'numeric' => ':attribute phải nhỏ hơn :value.',
        'string' => ':attribute phải ngắn hơn :value ký tự.',
    ],
    'lte' => [
        'array' => ':attribute không được có nhiều hơn :value phần tử.',
        'file' => ':attribute phải nhỏ hơn hoặc bằng :value kilobytes.',
        'numeric' => ':attribute phải nhỏ hơn hoặc bằng :value.',
        'string' => ':attribute phải ngắn hơn hoặc bằng :value ký tự.',
    ],
    'mac_address' => ':attribute phải là địa chỉ MAC hợp lệ.',
    'max' => [
        'array' => ':attribute không được có nhiều hơn :max phần tử.',
        'file' => ':attribute không được lớn hơn :max kilobytes.',
        'numeric' => ':attribute không được lớn hơn :max.',
        'string' => ':attribute không được dài hơn :max ký tự.',
    ],
    'max_digits' => ':attribute không được có nhiều hơn :max chữ số.',
    'mimes' => ':attribute phải là tệp tin có định dạng: :values.',
    'mimetypes' => ':attribute phải là tệp tin có định dạng: :values.',
    'min' => [
        'array' => ':attribute phải có ít nhất :min phần tử.',
        'file' => ':attribute phải có kích thước ít nhất :min kilobytes.',
        'numeric' => ':attribute phải có giá trị ít nhất :min.',
        'string' => ':attribute phải có độ dài ít nhất :min ký tự.',
    ],
    'min_digits' => ':attribute phải có ít nhất :min chữ số.',
    'missing' => ':attribute phải bị thiếu.',
    'missing_if' => ':attribute phải bị thiếu khi :other là :value.',
    'missing_unless' => ':attribute phải bị thiếu trừ khi :other là :value.',
    'missing_with' => ':attribute phải bị thiếu khi :values có mặt.',
    'missing_with_all' => ':attribute phải bị thiếu khi tất cả :values có mặt.',
    'multiple_of' => ':attribute phải là bội số của :value.',
    'not_in' => ':attribute đã chọn không hợp lệ.',
    'not_regex' => 'Định dạng :attribute không hợp lệ.',
    'numeric' => ':attribute phải là một số.',
    'password' => [
        'letters' => ':attribute phải chứa ít nhất một chữ cái.',
        'mixed' => ':attribute phải chứa ít nhất một chữ hoa và một chữ thường.',
        'numbers' => ':attribute phải chứa ít nhất một số.',
        'symbols' => ':attribute phải chứa ít nhất một ký tự đặc biệt.',
        'uncompromised' => ':attribute đã xuất hiện trong một vụ rò rỉ dữ liệu. Vui lòng chọn :attribute khác.',
    ],
    'present' => ':attribute phải có mặt.',
    'prohibited' => ':attribute bị cấm.',
    'prohibited_if' => ':attribute bị cấm khi :other là :value.',
    'prohibited_unless' => ':attribute bị cấm trừ khi :other nằm trong :values.',
    'prohibits' => ':attribute cấm :other có mặt.',
    'regex' => 'Định dạng :attribute không hợp lệ.',
    'required' => ':attribute là bắt buộc.',
    'required_array_keys' => ':attribute phải chứa các mục: :values.',
    'required_if' => ':attribute là bắt buộc khi :other là :value.',
    'required_if_accepted' => ':attribute là bắt buộc khi :other được chấp nhận.',
    'required_unless' => ':attribute là bắt buộc trừ khi :other nằm trong :values.',
    'required_with' => ':attribute là bắt buộc khi :values có mặt.',
    'required_with_all' => ':attribute là bắt buộc khi tất cả :values có mặt.',
    'required_without' => ':attribute là bắt buộc khi :values không có mặt.',
    'required_without_all' => ':attribute là bắt buộc khi không có :values nào có mặt.',
    'same' => ':attribute và :other phải khớp.',
    'size' => [
        'array' => ':attribute phải chứa :size phần tử.',
        'file' => ':attribute phải có kích thước :size kilobytes.',
        'numeric' => ':attribute phải bằng :size.',
        'string' => ':attribute phải có độ dài :size ký tự.',
    ],
    'starts_with' => ':attribute phải bắt đầu bằng một trong các giá trị sau: :values.',
    'string' => ':attribute phải là chuỗi ký tự.',
    'timezone' => ':attribute phải là múi giờ hợp lệ.',
    'unique' => ':attribute đã tồn tại.',
    'uploaded' => ':attribute tải lên thất bại.',
    'uppercase' => ':attribute phải là chữ hoa.',
    'url' => ':attribute phải là URL hợp lệ.',
    'ulid' => ':attribute phải là ULID hợp lệ.',
    'uuid' => ':attribute phải là UUID hợp lệ.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    */

    'custom' => [
        'ends_at' => [
            'after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
        ],
        'expires_at' => [
            'after' => 'Ngày hết hạn phải sau ngày sản xuất.',
        ],
        'email' => [
            'email' => 'Email không đúng định dạng.',
        ],
        'password' => [
            'confirmed' => 'Xác nhận mật khẩu không khớp.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    */

    'attributes' => [
        // User
        'name' => 'tên',
        'email' => 'email',
        'password' => 'mật khẩu',
        'password_confirmation' => 'xác nhận mật khẩu',
        'phone' => 'số điện thoại',
        'address' => 'địa chỉ',
        'role' => 'vai trò',
        
        // Customer
        'customer_name' => 'tên khách hàng',
        'customer_phone' => 'số điện thoại khách hàng',
        'customer_email' => 'email khách hàng',
        'shipping_address_line' => 'địa chỉ giao hàng',
        'shipping_city' => 'thành phố',
        'shipping_ward' => 'phường/xã',
        
        // Product
        'product_id' => 'sản phẩm',
        'product_name' => 'tên sản phẩm',
        'category_id' => 'danh mục',
        'supplier_id' => 'nhà cung cấp',
        'sku' => 'mã SKU',
        'price' => 'giá',
        'original_price' => 'giá gốc',
        'quantity' => 'số lượng',
        'unit_price' => 'đơn giá',
        'line_total' => 'tổng tiền',
        'discount_amount' => 'số tiền giảm',
        'description' => 'mô tả',
        'short_description' => 'mô tả ngắn',
        'thumbnail' => 'ảnh đại diện',
        'status' => 'trạng thái',
        
        // Order
        'order_id' => 'đơn hàng',
        'payment_method_id' => 'phương thức thanh toán',
        'payment_status' => 'trạng thái thanh toán',
        'subtotal' => 'tạm tính',
        'tax_total' => 'thuế',
        'grand_total' => 'tổng cộng',
        'notes' => 'ghi chú',
        'cancel_reason' => 'lý do hủy',
        
        // Promotion
        'code' => 'mã khuyến mãi',
        'promotion_type' => 'loại khuyến mãi',
        'promotion_category' => 'danh mục khuyến mãi',
        'value' => 'giá trị',
        'max_discount_value' => 'giảm tối đa',
        'min_order_value' => 'giá trị đơn hàng tối thiểu',
        'usage_limit' => 'giới hạn sử dụng',
        'starts_at' => 'ngày bắt đầu',
        'ends_at' => 'ngày kết thúc',
        'is_active' => 'kích hoạt',
        'is_stackable' => 'có thể xếp chồng',
        
        // Inventory
        'manufactured_at' => 'ngày sản xuất',
        'expires_at' => 'ngày hết hạn',
        'batch_number' => 'số lô',
        'unit_cost' => 'giá nhập',
        'reference_number' => 'số tham chiếu',
        'expected_at' => 'ngày dự kiến',
        
        // Review
        'rating' => 'đánh giá',
        'title' => 'tiêu đề',
        'comment' => 'bình luận',
        
        // Common
        'items' => 'sản phẩm',
        'items.*' => 'sản phẩm',
        'product_ids' => 'sản phẩm',
        'product_ids.*' => 'sản phẩm',
    ],

];
