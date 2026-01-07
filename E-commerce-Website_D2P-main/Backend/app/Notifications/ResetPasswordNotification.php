<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public $token;
    public $email;
    public $frontendUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct($token, $email, $frontendUrl = null)
    {
        $this->token = $token;
        $this->email = $email;
        $this->frontendUrl = $frontendUrl ?: config('app.frontend_url', 'http://localhost:5173');
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject('🔐 Đặt lại mật khẩu - ' . config('app.name'))
            ->greeting('Xin chào ' . $notifiable->name . '!')
            ->line('Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.')
            ->action('Đặt lại mật khẩu', $resetUrl)
            ->line('Link đặt lại mật khẩu này sẽ hết hạn sau **' . config('auth.passwords.'.config('auth.defaults.passwords').'.expire') . ' phút**.')
            ->line('Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.')
            ->line('Vì lý do bảo mật, vui lòng không chia sẻ link này với bất kỳ ai.')
            ->salutation('Trân trọng,  
' . config('app.name'));
    }

    /**
     * Get the reset URL for the given notifiable.
     */
    protected function resetUrl($notifiable): string
    {
        return $this->frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($this->email);
    }
}
