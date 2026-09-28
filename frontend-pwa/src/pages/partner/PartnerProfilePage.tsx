import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Lock, Save, AlertCircle } from 'lucide-react';
import type { PortalLoginResponse } from '@/types/user';
import { PageHeader } from '@/components/partner/PartnerUI';

export default function PartnerProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'info';

  const [session, setSession] = useState<PortalLoginResponse | null>(null);
  
  // Dummy form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('portal_user');
      if (raw) {
        const s = JSON.parse(raw) as PortalLoginResponse;
        setSession(s);
        setName(s.fullName || s.provider?.name || '');
        setEmail(s.email || '');
        setPhone(s.phone || '');
      }
    } catch {}
  }, []);

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setSuccessMsg('Đã cập nhật thông tin thành công.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    // Simulate API call
    setSuccessMsg('Đổi mật khẩu thành công.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[{ label: 'Bảng điều khiển', to: '/partner' }, { label: 'Tài khoản & Bảo mật' }]}
        title="Tài khoản & Bảo mật"
      />
      
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="flex border-b border-border">
          <button
            onClick={() => setSearchParams({ tab: 'info' })}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${tab === 'info' ? 'border-b-2 border-primary text-primary bg-primary-50/50' : 'text-muted hover:text-ink hover:bg-canvas'}`}
          >
            <User className="inline-block w-4 h-4 mr-2" />
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'password' })}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${tab === 'password' ? 'border-b-2 border-primary text-primary bg-primary-50/50' : 'text-muted hover:text-ink hover:bg-canvas'}`}
          >
            <Lock className="inline-block w-4 h-4 mr-2" />
            Đổi mật khẩu
          </button>
        </div>

        <div className="p-6">
          {successMsg && (
            <div className="mb-6 p-3 bg-accent/10 border border-accent/20 rounded-md flex items-center gap-2 text-primary-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          {tab === 'info' && (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-deep mb-1">Tên nhà cung cấp / Họ tên</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-deep mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full h-10 px-3 border border-border rounded-md text-sm bg-canvas text-muted cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-muted">Email đăng nhập không thể thay đổi.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-deep mb-1">Số điện thoại</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-4 border-t border-border flex justify-end">
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-hover shadow-sm">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-deep mb-1">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-deep mb-1">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-deep mb-1">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="pt-4 border-t border-border flex justify-end">
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-coral text-white text-sm font-semibold rounded-md hover:bg-coral-hover shadow-sm">
                  <Save className="w-4 h-4" />
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
