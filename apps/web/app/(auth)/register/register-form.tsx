'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { validateRegisterForm, hasErrors, type ValidationErrors } from '@/lib/validation';

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validateRegisterForm(fullname, email, password, acceptTerms);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.register({ fullname, email, password });
      login(response.user);
      router.push('/');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setApiError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
          {apiError}
        </div>
      )}

      {/* Full Name Field */}
      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Nom complet</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Jean Dupont"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm ${
              errors.fullname ? 'border-red-400' : 'border-orange-200 focus:border-orange-400'
            }`}
          />
        </div>
        {errors.fullname && (
          <p className="text-xs text-red-500 font-medium">{errors.fullname}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm ${
              errors.email ? 'border-red-400' : 'border-orange-200 focus:border-orange-400'
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 font-medium">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Mot de passe</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm ${
              errors.password ? 'border-red-400' : 'border-orange-200 focus:border-orange-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password ? (
          <p className="text-xs text-red-500 font-medium">{errors.password}</p>
        ) : (
          <p className="text-xs text-slate-500">Minimum 6 caractères</p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 rounded border-orange-300 text-orange-500 focus:ring-orange-400"
          />
          <label htmlFor="terms" className="text-xs text-slate-600 font-medium cursor-pointer">
            J&apos;accepte les{' '}
            <Link href="/terms" className="text-orange-600 hover:text-rose-600 font-bold">
              conditions
            </Link>{' '}
            et la{' '}
            <Link href="/privacy" className="text-orange-600 hover:text-rose-600 font-bold">
              politique de confidentialité
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-red-500 font-medium">{errors.terms}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative group w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all overflow-hidden mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
          {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </form>
  );
}
