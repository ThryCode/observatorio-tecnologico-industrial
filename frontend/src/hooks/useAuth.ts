import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import * as authApi from '@/api/auth';
import type { LoginRequest } from '@/types';

export function useLogin() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (res) => {
      await loginSuccess(res.access_token);
      navigate('/');
    },
  });
}
