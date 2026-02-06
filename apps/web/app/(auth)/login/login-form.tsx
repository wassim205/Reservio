'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { validateLoginForm, hasErrors, type ValidationErrors } from '@/lib/validation';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validateLoginForm(email, password);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.login({ email, password });
      login(response.user);
      
      // Redirect admin to dashboard, participants to home
      if (response.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setApiError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
          {apiError}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full pl-12 pr-4 py-3.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all ${
              errors.email ? 'border-red-400' : 'border-orange-200 focus:border-orange-400'
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 font-medium">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700">Mot de passe</label>
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-orange-600 hover:text-rose-600 transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full pl-12 pr-12 py-3.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all ${
              errors.password ? 'border-red-400' : 'border-orange-200 focus:border-orange-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 font-medium">{errors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative group w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? 'Connexion...' : 'Se connecter'}
          {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </form>
  );
}
