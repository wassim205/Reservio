'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Event, Registration } from '@/lib/types';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  LogOut,
  User,
  Ticket,
  Share2,
  Zap,
  Shield,
  CheckCircle,
  Download,
} from 'lucide-react';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Registration state
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // Ticket download state
  const [downloadingTicket, setDownloadingTicket] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await api.getEvent(eventId);
        setEvent(response.event);
        
        // Check if user already has a registration for this event
        if (user) {
          const registration = await api.checkRegistration(eventId);
          setMyRegistration(registration);
        }
      } catch {
        setError('Événement non trouvé');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId, user]);

  // Handle reservation
  const handleReserve = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }

    setReserving(true);
    setReservationError(null);

    try {
      const { registration } = await api.registerForEvent(eventId);
      setMyRegistration(registration);
      setReservationSuccess(true);
      
      // Update remaining seats
      if (event) {
        setEvent({
          ...event,
          remainingSeats: (event.remainingSeats ?? event.capacity) - 1,
        });
      }
    } catch (err) {
      const apiError = err as { message: string; statusCode?: number };
      // Translate common API errors to French user-friendly messages
      let errorMessage = 'Une erreur est survenue lors de la réservation';
      
      if (apiError.message) {
        if (apiError.message.includes('already registered') || apiError.message.includes('déjà inscrit')) {
          errorMessage = 'Vous êtes déjà inscrit à cet événement';
        } else if (apiError.message.includes('past') || apiError.message.includes('passé')) {
          errorMessage = 'Cet événement est déjà passé';
        } else if (apiError.message.includes('full') || apiError.message.includes('complet')) {
          errorMessage = 'Cet événement est complet';
        } else if (apiError.message.includes('not found') || apiError.message.includes('introuvable')) {
          errorMessage = 'Événement introuvable';
        } else if (apiError.message.includes('Unauthorized') || apiError.statusCode === 401) {
          errorMessage = 'Veuillez vous connecter pour réserver';
          router.push(`/login?redirect=/events/${eventId}`);
          return;
        } else {
          errorMessage = apiError.message;
        }
      }
      
      setReservationError(errorMessage);
    } finally {
      setReserving(false);
    }
  };

  // Handle ticket download
  const handleDownloadTicket = async () => {
    if (!myRegistration) return;

    setDownloadingTicket(true);
    try {
      const blob = await api.downloadTicket(myRegistration.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${event?.title?.replace(/\s+/g, '-') || 'reservio'}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const apiError = err as { message: string };
      setReservationError(apiError.message || 'Erreur lors du téléchargement du ticket');
    } finally {
      setDownloadingTicket(false);
    }
  };

  // Format full date
  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if event is in the past
  const isPastEvent = event ? new Date(event.endDate) < new Date() : false;

  // Remaining seats
  const remainingSeats = event ? (event.remainingSeats ?? event.capacity) : 0;
  const isSoldOut = remainingSeats === 0;
  const isAlmostFull = remainingSeats <= 5 && remainingSeats > 0;

  // Share event
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch {
        // Share cancelled by user
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier !');
    }
  };

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
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
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

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-500">Chargement de l&apos;événement...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Événement non trouvé</h2>
            <p className="text-gray-500 mb-6">
              Cet événement n&apos;existe pas ou a été supprimé.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voir tous les événements
            </Link>
          </div>
        )}

        {/* Event Details */}
        {event && !loading && (
          <div className="space-y-6">
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-orange-200">
              {/* Hero Banner */}
              <div className="h-48 sm:h-64 bg-linear-to-br from-orange-500 to-rose-500 relative">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/60 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    {isPastEvent ? (
                      <span className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
                        Événement passé
                      </span>
                    ) : isSoldOut ? (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        Complet
                      </span>
                    ) : isAlmostFull ? (
                      <span className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                        Presque complet
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        Places disponibles
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {event.title}
                  </h1>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-6 sm:p-8">
                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {/* Date */}
                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-600 font-medium mb-1">Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatFullDate(event.startDate)}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium mb-1">Horaire</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium mb-1">Lieu</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {event.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                {/* Capacity Info */}
                <div className="p-4 bg-gray-50 rounded-xl mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700 font-medium">Capacité</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {remainingSeats} / {event.capacity}
                      </p>
                      <p className="text-xs text-gray-500">places disponibles</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSoldOut
                          ? 'bg-red-500'
                          : isAlmostFull
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${((event.capacity - remainingSeats) / event.capacity) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Organizer */}
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl mb-8">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold">
                    {event.createdBy.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Organisé par</p>
                    <p className="font-semibold text-slate-900">{event.createdBy.fullname}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Success Message */}
                  {reservationSuccess && (
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-100 text-green-700 font-semibold rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                      Réservation envoyée ! En attente de confirmation.
                    </div>
                  )}

                  {/* Error Message */}
                  {reservationError && (
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-100 text-red-600 font-semibold rounded-xl">
                      <AlertCircle className="w-5 h-5" />
                      {reservationError}
                    </div>
                  )}

                  {/* Already Registered - PENDING */}
                  {myRegistration && myRegistration.status === 'PENDING' && !reservationSuccess && (
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-amber-100 text-amber-700 font-semibold rounded-xl">
                      <Clock className="w-5 h-5" />
                      Réservation en attente de confirmation
                    </div>
                  )}

                  {/* Already Registered - CONFIRMED with Download Button */}
                  {myRegistration && myRegistration.status === 'CONFIRMED' && !reservationSuccess && (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-3">
                      <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-100 text-green-700 font-semibold rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                        Vous êtes inscrit !
                      </div>
                      <button
                        onClick={handleDownloadTicket}
                        disabled={downloadingTicket}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingTicket ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Télécharger ticket
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Reserve Button - Show only if not registered, not past, not sold out */}
                  {!isPastEvent && !isSoldOut && !myRegistration && !reservationSuccess && (
                    <button
                      onClick={handleReserve}
                      disabled={reserving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reserving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Réservation en cours...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-5 h-5" />
                          {user ? 'Réserver ma place' : 'Se connecter pour réserver'}
                        </>
                      )}
                    </button>
                  )}

                  {isPastEvent && (
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-500 font-semibold rounded-xl">
                      <Clock className="w-5 h-5" />
                      Événement terminé
                    </div>
                  )}

                  {!isPastEvent && isSoldOut && !myRegistration && (
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-100 text-red-600 font-semibold rounded-xl">
                      <Users className="w-5 h-5" />
                      Complet
                    </div>
                  )}

                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="sm:hidden">Partager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 Reservio. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
