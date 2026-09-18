import { useState } from 'react';

// Giả lập thư viện Google OAuth (ví dụ: @react-oauth/google)
// Thực tế bạn cần bọc App.tsx bằng <GoogleOAuthProvider clientId="...">

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Lấy idToken từ credentialResponse (của Google)
      const idToken = credentialResponse.credential;
      
      // 2. Gửi idToken xuống Backend API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) throw new Error('Đăng nhập thất bại từ server');
      
      const data = await response.json();
      
      // 3. Lưu JWT Token của hệ thống vào localStorage hoặc Context
      localStorage.setItem('sys_token', data.token);
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { loginWithGoogle, isLoading, error };
}
