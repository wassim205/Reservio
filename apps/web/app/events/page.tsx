'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Event } from '@/lib/types';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  AlertCircle,
  LogOut,
  User,
  Zap,
  Shield,
  Loader2,
} from 'lucide-react';

export default function EventsPage() {
  const { user, logout, isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await api.getPublishedEvents();
        setEvents(response.events);
      } catch (err) {
        setError('Erreur lors du chargement des événements');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Check if event is in the past
  const isPastEvent = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Filter events by search
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase())
  );

  // Separate upcoming and past events
  const upcomingEvents = filteredEvents.filter((e) => !isPastEvent(e.endDate));
  const pastEvents = filteredEvents.filter((e) => isPastEvent(e.endDate));

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Navigation - Same as Home Page */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-orange-500 to-rose-500 rounded-xl blur-lg opacity-50" />
              <div className="relative bg-linear-to-r from-orange-500 to-rose-500 p-2 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Reservio
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/events"
              className="text-sm font-semibold text-orange-600 transition-colors"
            >
              Événements
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role Badge with User Name */}
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
                  <span className="hidden sm:inline">Déconnexion</span>
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
      <section className="relative py-16 px-6">
        <div className="absolute inset-0 bg-linear-to-b from-orange-100/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
            Tous les événements
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Trouvez et réservez votre place pour les prochains événements
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, lieu ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-slate-900 placeholder-slate-400 shadow-xl border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50 focus:outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        {/* Error state */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Chargement des événements...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border-2 border-orange-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              {search ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
            </h2>
            <p className="text-slate-500">
              {search
                ? 'Essayez de modifier votre recherche'
                : 'Revenez bientôt pour découvrir nos prochains événements'}
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-orange-200">
                <p className="text-2xl font-black text-orange-500">{upcomingEvents.length}</p>
                <p className="text-sm text-slate-500 font-medium">Événements à venir</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-slate-200">
                <p className="text-2xl font-black text-slate-400">{pastEvents.length}</p>
                <p className="text-sm text-slate-500 font-medium">Événements passés</p>
              </div>
              <div className="hidden sm:block bg-white rounded-xl p-4 shadow-sm border-2 border-green-200">
                <p className="text-2xl font-black text-green-500">
                  {upcomingEvents.reduce((acc, e) => acc + (e.remainingSeats ?? e.capacity), 0)}
                </p>
                <p className="text-sm text-slate-500 font-medium">Places disponibles</p>
              </div>
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  Événements à venir
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
                    {upcomingEvents.length}
                  </span>
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-slate-400 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  Événements passés
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-sm font-bold rounded-full">
                    {pastEvents.length}
                  </span>
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 border-t border-orange-200/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm font-medium">
          © 2026 Reservio. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

// Gradient colors for event cards
const gradients = [
  'from-orange-400 to-rose-500',
  'from-teal-400 to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-indigo-500',
];

// Event Card Component - Same style as Home Page
function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  const bookedSeats = event.capacity - (event.remainingSeats ?? event.capacity);
  const bookingPercentage = (bookedSeats / event.capacity) * 100;
  const remainingSeats = event.remainingSeats ?? event.capacity;
  const isSoldOut = remainingSeats === 0;
  const isAlmostFull = remainingSeats <= 5 && remainingSeats > 0;
  
  // Get a consistent gradient based on event id
  const gradientIndex = event.id.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Link
      href={`/events/${event.id}`}
      className={`group bg-white rounded-2xl overflow-hidden border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer ${isPast ? 'opacity-60' : ''}`}
    >
      <div className={`relative h-40 overflow-hidden bg-linear-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-800 shadow-lg">
          {isPast ? 'Passé' : 'Événement'}
        </div>
        {!isPast && (
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
        )}
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-black text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>
              {new Date(event.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {!isPast && (
          <div className="pt-3 border-t-2 border-orange-100">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-slate-600 font-medium">Places restantes</span>
              {isSoldOut ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  <Users className="w-3 h-3" />
                  Complet
                </span>
              ) : isAlmostFull ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
                  <Users className="w-3 h-3" />
                  {remainingSeats} restant{remainingSeats > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="font-black text-slate-800">
                  {remainingSeats}/{event.capacity}
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-orange-500 to-rose-500 transition-all rounded-full"
                style={{ width: `${bookingPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="w-full py-2.5 bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all text-center text-sm">
          Voir les détails
        </div>
      </div>
    </Link>
  );
}
