'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Event } from '@/lib/types';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Zap,
  Clock,
  Shield,
  Ticket,
  Star,
  TrendingUp,
  Award,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';

// Gradient colors for event cards
const gradients = [
  'from-orange-400 to-rose-500',
  'from-teal-400 to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-indigo-500',
];

// Feature items data
const features = [
  {
    icon: Shield,
    title: 'Sécurité maximale',
    description: 'Authentification JWT et gestion avancée des rôles',
    gradient: 'from-orange-500 to-red-500',
    bg: 'from-orange-50 to-red-50',
    border: 'border-orange-300',
  },
  {
    icon: Ticket,
    title: 'Tickets PDF instantanés',
    description: 'Téléchargez vos billets immédiatement après confirmation',
    gradient: 'from-rose-500 to-pink-500',
    bg: 'from-rose-50 to-pink-50',
    border: 'border-rose-300',
  },
  {
    icon: Users,
    title: 'Gestion intelligente',
    description: 'Contrôle en temps réel des capacités disponibles',
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-300',
  },
  {
    icon: Calendar,
    title: 'Calendrier intuitif',
    description: 'Visualisez tous vos événements en un coup d&apos;œil',
    gradient: 'from-teal-500 to-cyan-500',
    bg: 'from-teal-50 to-cyan-50',
    border: 'border-teal-300',
  },
  {
    icon: Clock,
    title: 'Notifications instantanées',
    description: 'Alertes en temps réel pour vos réservations',
    gradient: 'from-amber-500 to-yellow-500',
    bg: 'from-amber-50 to-yellow-50',
    border: 'border-amber-300',
  },
  {
    icon: MapPin,
    title: 'Multi-destinations',
    description: 'Événements dans différentes villes du Maroc',
    gradient: 'from-green-500 to-emerald-500',
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-300',
  },
];

export default function Home() {
  const { user, isLoading, isAdmin, logout } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const isVisible = true;

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch published events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { events } = await api.getPublishedEvents();
        setEvents(events.slice(0, 4)); // Limit to 4 events on home page
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-rose-50 text-slate-900 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(251, 146, 60, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Floating Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%)',
            top: '10%',
            left: '5%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            top: '50%',
            right: '10%',
          }}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrollY > 50
            ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-orange-200/50'
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className={`flex items-center gap-3 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-orange-500 to-rose-500 rounded-xl blur-lg opacity-50" />
              <div className="relative bg-linear-to-r from-orange-500 to-rose-500 p-2 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Reservio
            </span>
          </div>

          {/* Nav Links */}
          <div
            className={`hidden md:flex items-center gap-8 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <Link
              href="/events"
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
            >
              Événements
            </Link>
            <a
              href="#features"
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
            >
              Fonctionnalités
            </a>
          </div>

          {/* Auth Buttons */}
          <div
            className={`flex items-center gap-3 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            {user ? (
              <>
                {/* Role Badge */}
                {isAdmin ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold rounded-full">
                    <Shield className="w-4 h-4" />
                    Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-orange-400 to-rose-400 text-white text-sm font-bold rounded-full">
                    <User className="w-4 h-4" />
                    {user.fullname}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="relative group px-6 py-2.5 bg-linear-to-r from-orange-500 to-rose-500 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all overflow-hidden"
                >
                  <span className="relative z-10">Inscription</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8 relative z-10">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border-2 border-orange-300 rounded-full shadow-lg transition-all duration-700 delay-300 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-orange-700">
                  Plateforme N°1 au Maroc
                </span>
              </div>

              <h1
                className={`text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight transition-all duration-700 delay-400 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <span className="block">Découvrez &</span>
                <span className="block mt-2 bg-linear-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Réservez
                </span>
                <span className="block mt-2">vos événements</span>
              </h1>

              <p
                className={`text-xl text-slate-700 leading-relaxed max-w-lg font-medium transition-all duration-700 delay-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                La solution moderne et intuitive pour gérer vos réservations.
                <span className="text-orange-600 font-bold">
                  {' '}
                  Simple, rapide et sécurisée.
                </span>
              </p>

              <div
                className={`flex flex-wrap gap-4 transition-all duration-700 delay-600 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <a
                  href="#events"
                  className="group px-8 py-4 bg-linear-to-r from-orange-500 to-rose-500 rounded-2xl text-base font-bold text-white shadow-xl hover:shadow-2xl hover:shadow-orange-500/40 transition-all hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    Explorer les événements
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              </div>

              {/* Stats */}
              <div
                className={`relative mt-12 transition-all duration-700 delay-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative bg-white/60 backdrop-blur-sm border-2 border-orange-200 rounded-3xl p-8 shadow-xl">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-black bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                        500+
                      </div>
                      <div className="text-sm text-slate-600 mt-1 font-semibold">
                        Événements
                      </div>
                    </div>
                    <div className="text-center border-x-2 border-orange-200">
                      <div className="text-4xl font-black bg-linear-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                        12K+
                      </div>
                      <div className="text-sm text-slate-600 mt-1 font-semibold">
                        Participants
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        98%
                      </div>
                      <div className="text-sm text-slate-600 mt-1 font-semibold">
                        Satisfaction
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Featured Event Card */}
            <div
              className={`relative transition-all duration-700 delay-800 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="relative">
                <div className="absolute -right-4 -top-4 w-full h-full bg-linear-to-br from-orange-300 to-rose-300 rounded-3xl rotate-2 opacity-30" />
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-orange-200 overflow-hidden">
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1.5 bg-linear-to-r from-orange-500 to-rose-500 text-white rounded-full text-xs font-bold shadow-lg">
                        ⭐ Événement phare
                      </span>
                      <div className="flex gap-1">
                        <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                        <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                        <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                      </div>
                    </div>

                    <div className="relative h-56 rounded-2xl overflow-hidden shadow-xl bg-linear-to-br from-orange-500 via-rose-500 to-pink-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar
                          className="w-24 h-24 text-white/80"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-orange-600 shadow-lg">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Tendance
                      </div>
                      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-rose-600 shadow-lg">
                        27 places restantes
                      </div>
                    </div>

                    <div>
                      <h3 className="text-3xl font-black mb-3 bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                        Design Summit 2026
                      </h3>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        Rejoignez les meilleurs designers pour une journée
                        d&apos;inspiration
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="bg-linear-to-br from-orange-50 to-rose-50 rounded-xl p-3 border border-orange-200">
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span>15 Mars 2026</span>
                        </div>
                      </div>
                      <div className="bg-linear-to-br from-teal-50 to-cyan-50 rounded-xl p-3 border border-teal-200">
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                          <MapPin className="w-4 h-4 text-teal-600" />
                          <span>Tanger</span>
                        </div>
                      </div>
                      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>87/120 places</span>
                        </div>
                      </div>
                      <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>14:00 - 18:00</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-4 bg-linear-to-r from-orange-500 to-rose-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all">
                      <span className="flex items-center justify-center gap-2">
                        Réserver maintenant
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6" id="features">
        <div className="absolute inset-0 bg-linear-to-b from-white/60 to-orange-100/60 backdrop-blur-sm" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border-2 border-orange-300 rounded-full mb-6 shadow-lg">
              <Award className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-bold text-orange-700">
                Ce qui nous rend unique
              </span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Pourquoi choisir
              <span className="block mt-2 bg-linear-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                Reservio ?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-linear-to-br ${feature.bg} rounded-2xl p-8 border-2 ${feature.border} shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer overflow-hidden`}
              >
                <div
                  className={`relative inline-flex p-4 bg-linear-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black mb-3 text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="relative py-24 px-6" id="events">
        <div className="absolute inset-0 bg-linear-to-b from-orange-100/60 to-rose-100/60" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-5xl font-black mb-3 bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Événements à venir
              </h2>
              <p className="text-xl text-slate-700 font-medium">
                Découvrez les prochains événements disponibles
              </p>
            </div>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-600 mb-2">
                Aucun événement disponible
              </h3>
              <p className="text-slate-500">
                Revenez bientôt pour découvrir nos prochains événements !
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event, index) => {
                  const bookedSeats = event.capacity - (event.remainingSeats ?? event.capacity);
                  const bookingPercentage = (bookedSeats / event.capacity) * 100;
                  const gradient = gradients[index % gradients.length];
                  
                  return (
                    <Link
                      href={`/events/${event.id}`}
                      key={event.id}
                      className="group bg-white rounded-2xl overflow-hidden border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer"
                    >
                      <div
                        className={`relative h-48 overflow-hidden bg-linear-to-br ${gradient}`}
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-800 shadow-lg">
                          Événement
                        </div>
                        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-lg">
                          <span
                            className={`${
                              bookingPercentage > 80
                                ? 'text-red-600'
                                : bookingPercentage > 50
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {Math.round(bookingPercentage)}% réservé
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <h3 className="text-xl font-black text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                            <MapPin className="w-4 h-4 text-rose-600" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t-2 border-orange-100">
                          <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-slate-600 font-semibold">
                              Places restantes
                            </span>
                            <span className="font-black text-slate-800">
                              {event.remainingSeats ?? event.capacity}/{event.capacity}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-orange-500 to-rose-500 transition-all rounded-full"
                              style={{
                                width: `${bookingPercentage}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="w-full py-3 bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all text-center">
                          Voir les détails
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-orange-300 rounded-xl font-bold text-orange-600 shadow-lg hover:shadow-xl hover:bg-orange-50 transition-all"
                >
                  Voir tous les événements
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-linear-to-br from-orange-600 via-rose-600 to-pink-600" />
        <div className="relative max-w-6xl mx-auto">
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-12 lg:p-16 border-2 border-white/20 shadow-2xl overflow-hidden">
            <div className="relative text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">
                  Rejoignez-nous aujourd&apos;hui
                </span>
              </div>

              <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight">
                Prêt à transformer votre
                <span className="block mt-2">expérience événementielle ?</span>
              </h2>

              <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
                Rejoignez des milliers d&apos;utilisateurs qui font confiance à
                Reservio
              </p>

              <div className="flex flex-wrap gap-4 justify-center pt-6">
                {user ? (
                  <a
                    href="#events"
                    className="group px-10 py-5 bg-white rounded-2xl font-black text-orange-600 shadow-2xl hover:shadow-white/30 transition-all hover:scale-110"
                  >
                    <span className="flex items-center gap-2">
                      Voir les événements
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </a>
                ) : (
                  <Link
                    href="/register"
                    className="group px-10 py-5 bg-white rounded-2xl font-black text-orange-600 shadow-2xl hover:shadow-white/30 transition-all hover:scale-110"
                  >
                    <span className="flex items-center gap-2">
                      Créer un compte gratuitement
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                )}
              </div>

              <div className="pt-8 flex items-center justify-center gap-8 text-white/80 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-sm font-semibold">Pas de carte requise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-sm font-semibold">Configuration en 2 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-sm font-semibold">Support 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t-2 border-orange-200 py-16 px-6">
        <div className="absolute inset-0 bg-linear-to-br from-orange-50 to-rose-50" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative bg-linear-to-r from-orange-500 to-rose-500 p-2 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  Reservio
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                La plateforme moderne de gestion d&apos;événements
              </p>
            </div>

            <div>
              <h4 className="font-black text-slate-800 mb-4 text-lg">Produit</h4>
              <ul className="space-y-3 text-slate-600 font-semibold">
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Tarifs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-800 mb-4 text-lg">Entreprise</h4>
              <ul className="space-y-3 text-slate-600 font-semibold">
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-800 mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-slate-600 font-semibold">
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition-colors">
                    Aide
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-orange-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 font-semibold">
              © 2026 Reservio. Tous droits réservés. Fait avec ❤️ au Maroc
            </p>
            <div className="flex gap-6 text-slate-600 font-semibold">
              <a href="#" className="hover:text-orange-600 transition-colors">
                Confidentialité
              </a>
              <a href="#" className="hover:text-orange-600 transition-colors">
                Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
