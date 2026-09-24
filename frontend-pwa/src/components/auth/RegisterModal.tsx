import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, Building2, User, Mail, Phone, Lock } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccessLogin }) => {
  const [accountType, setAccountType] = useState<'TRAVELER' | 'PARTNER'>('TRAVELER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [providerName, setProviderName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    if (accountType === 'PARTNER' && !providerName.trim()) {
      setErrorMessage('Vui lòng nhập tên cơ sở du lịch / Homestay.');
      return;
    }

    // Giả lập lưu đăng ký hoặc thông báo thành công
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[var(--color-bg-canvas,#F6FAF8)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary,#048C73)] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Đăng ký tài khoản</h3>
              <p className="text-xs text-slate-500">Gia nhập hệ sinh thái Du lịch số Việt Nam</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isSuccess ? (
            <div className="text-center py-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">Đăng ký thành công!</h4>
              <p className="text-xs text-slate-600 max-w-xs mb-5">
                {accountType === 'PARTNER'
                  ? 'Hồ sơ đối tác đã được ghi nhận. Bạn có thể đăng nhập ngay để quản lý cơ sở.'
                  : 'Tài khoản khách du lịch của bạn đã sẵn sàng khám phá Tây Bắc.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                  if (onSuccessLogin) onSuccessLogin();
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-[var(--color-primary,#048C73)] hover:bg-[#03705C] rounded-md transition-colors"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
                  {errorMessage}
                </div>
              )}

              {/* Loại tài khoản */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại tài khoản</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('TRAVELER')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-md border transition-all ${
                      accountType === 'TRAVELER'
                        ? 'border-[var(--color-primary,#048C73)] bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary,#048C73)] font-semibold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Khách du lịch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('PARTNER')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-md border transition-all ${
                      accountType === 'PARTNER'
                        ? 'border-[var(--color-primary,#048C73)] bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary,#048C73)] font-semibold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Đối tác / NCC</span>
                  </button>
                </div>
              </div>

              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  />
                </div>
              </div>

              {/* Đối tác: Tên cơ sở */}
              {accountType === 'PARTNER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Homestay / Cơ sở *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="Bản Lìm Mông Eco Lodge"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                    />
                  </div>
                </div>
              )}

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.vn"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                    />
                  </div>
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[var(--color-primary,#048C73)] hover:bg-[#03705C] rounded-md transition-all shadow-xs"
                >
                  Hoàn tất Đăng ký
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
