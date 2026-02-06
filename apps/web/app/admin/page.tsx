'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event, EventStatus, AdminStats } from '@/lib/types';
import {
  Calendar,
  Users,
  TrendingUp,
  Plus,
  AlertCircle,
  Loader2,
  FileEdit,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Ticket,
  Target,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsData, statsData] = await Promise.all([
          api.getEvents(),
          api.getAdminStats(),
        ]);
        setEvents(eventsData.events);
        setStats(statsData.stats);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get recent events (last 5)
  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
            <FileEdit className="w-3 h-3" />
            Brouillon
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Publié
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
            <XCircle className="w-3 h-3" />
            Annulé
          </span>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-pulse"></div>
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-500 mt-4 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-100 rounded-xl">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-rose-700">Erreur</h2>
          </div>
          <p className="text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  const fillRatePercentage = stats?.fillRate.averagePercentage ?? 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Tableau de bord
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenue ! Voici un aperçu de votre plateforme
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Nouvel événement
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Events */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total événements</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.events.total ?? 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {stats?.events.upcoming ?? 0} à venir
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.registrations.total ?? 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {stats?.registrations.confirmed ?? 0} confirmées
                </span>
              </div>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-500 transition-colors">
              <Ticket className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Fill Rate */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Taux de remplissage</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{Math.round(fillRatePercentage)}%</p>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(fillRatePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-500 transition-colors">
              <Target className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Pending Registrations */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.registrations.pending ?? 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  À traiter
                </span>
              </div>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-500 transition-colors">
              <Clock className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Event Status + Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Statut des événements</h2>
          </div>
          
          <div className="space-y-4">
            {/* Published */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-28">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Publiés</span>
              </div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.events.total ? ((stats.events.published / stats.events.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-8 text-right">{stats?.events.published ?? 0}</span>
            </div>
            
            {/* Draft */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-28">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-sm text-gray-600">Brouillons</span>
              </div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.events.total ? ((stats.events.draft / stats.events.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-8 text-right">{stats?.events.draft ?? 0}</span>
            </div>
            
            {/* Cancelled */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-28">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm text-gray-600">Annulés</span>
              </div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.events.total ? ((stats.events.cancelled / stats.events.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-8 text-right">{stats?.events.cancelled ?? 0}</span>
            </div>
          </div>

          {/* Registration Status */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Inscriptions</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-emerald-50 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{stats?.registrations.confirmed ?? 0}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">Confirmées</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{stats?.registrations.pending ?? 0}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">En attente</p>
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-xl">
                <p className="text-2xl font-bold text-rose-600">{stats?.registrations.cancelled ?? 0}</p>
                <p className="text-xs text-rose-600 font-medium mt-1">Annulées</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Événements populaires</h2>
            </div>
          </div>
          
          {stats?.topEvents && stats.topEvents.length > 0 ? (
            <div className="space-y-4">
              {stats.topEvents.map((event, index) => (
                <div key={event.id} className="group">
                  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {event.confirmedCount} / {event.capacity} places
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full"
                            style={{ width: `${Math.min(event.fillPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        event.fillPercentage >= 80 ? 'text-emerald-600' :
                        event.fillPercentage >= 50 ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {Math.round(event.fillPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Aucun événement avec des inscriptions</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
          <Sparkles className="w-5 h-5 text-orange-400" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/events/new"
            className="group flex items-center gap-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all"
          >
            <div className="p-2 bg-orange-500 rounded-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Créer un événement</p>
              <p className="text-sm text-gray-500">Ajouter un nouveau</p>
            </div>
            <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-orange-500 transition-colors" />
          </Link>

          <Link
            href="/admin/events?status=DRAFT"
            className="group flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
          >
            <div className="p-2 bg-slate-500 rounded-lg">
              <FileEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Voir les brouillons</p>
              <p className="text-sm text-gray-500">{stats?.events.draft ?? 0} en attente</p>
            </div>
            <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-orange-500 transition-colors" />
          </Link>

          <Link
            href="/admin/events"
            className="group flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
          >
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gérer les événements</p>
              <p className="text-sm text-gray-500">Voir tous</p>
            </div>
            <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-orange-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Événements récents</h2>
          <Link
            href="/admin/events"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-1 group"
          >
            Voir tout
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun événement pour le moment</p>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold mt-3"
            >
              <Plus className="w-4 h-4" />
              Créer votre premier événement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Événement
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Capacité
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="font-semibold text-gray-900 hover:text-orange-500 transition-colors"
                      >
                        {event.title}
                      </Link>
                      {event.location && (
                        <p className="text-sm text-gray-500 mt-0.5">{event.location}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(event.status)}</td>
                    <td className="py-4 px-6 text-right">
                      {event.capacity ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <Users className="w-4 h-4" />
                          {event.capacity}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Illimitée</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
