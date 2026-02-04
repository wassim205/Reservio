'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(251, 146, 60, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(236, 72, 153, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '30px 30px',
          }}
        />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%)',
            top: '5%',
            right: '10%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            bottom: '10%',
            left: '5%',
          }}
        />
      </div>

      {/* Decorative Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 border-4 border-orange-400/20 rounded-3xl -rotate-12" />
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-rose-400/10 rounded-full" />
        <div className="absolute top-1/3 right-10 w-16 h-16 border-4 border-teal-400/20 rounded-full" />
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-md">
        {/* Background decorative cards */}
        <div className="absolute -left-4 -top-4 w-full h-full bg-gradient-to-br from-rose-200 to-orange-200 rounded-3xl -rotate-2 blur-sm opacity-50" />
        <div className="absolute -left-2 -top-2 w-full h-full bg-gradient-to-br from-rose-300 to-orange-300 rounded-3xl -rotate-1 opacity-30" />

        {/* Main Card */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-2 border-orange-200 overflow-hidden">
          {/* Decorative corner element */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-rose-400 to-orange-400 opacity-10 rounded-full blur-2xl" />

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-r from-orange-500 to-rose-500 p-2 rounded-xl">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Réservio
            </span>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-black text-slate-800 mb-1">Créer un compte</h1>
            <p className="text-sm text-slate-600 font-medium">
              Rejoignez la communauté Réservio
            </p>
          </div>

          {/* Form */}
          <form className="space-y-3">
            {/* Fullname Field */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Nom complet</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-orange-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                />
              </div>
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
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-orange-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                />
              </div>
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
                  className="w-full pl-10 pr-10 py-2.5 bg-gradient-to-br from-orange-50 to-rose-50 border-2 border-orange-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimum 6 caractères</p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
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

            {/* Submit Button */}
            <button
              type="submit"
              className="relative group w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all overflow-hidden mt-2"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                Créer mon compte
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-orange-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs font-semibold text-slate-500">
                ou continuer avec
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center mt-4 text-sm text-slate-600 font-medium">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-bold text-orange-600 hover:text-rose-600 transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
