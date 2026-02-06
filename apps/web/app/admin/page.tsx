'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event, EventStatus } from '@/lib/types';
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
} from 'lucide-react';

interface EventStats {
  total: number;
  draft: number;
  published: number;
  cancelled: number;
}

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await api.getEvents();
        setEvents(data.events);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors du chargement des événements';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Calculate stats
  const stats: EventStats = events.reduce(
    (acc, event) => {
      acc.total++;
      if (event.status === 'DRAFT') acc.draft++;
      else if (event.status === 'PUBLISHED') acc.published++;
      else if (event.status === 'CANCELLED') acc.cancelled++;
      return acc;
    },
    { total: 0, draft: 0, published: 0, cancelled: 0 }
  );

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
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            <FileEdit className="w-3 h-3" />
            Brouillon
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Publié
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <XCircle className="w-3 h-3" />
            Annulé
          </span>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Erreur</h2>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">
            Vue d&apos;ensemble de vos événements
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvel événement
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total événements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Draft Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-xl">
              <FileEdit className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>

        {/* Published Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Publiés</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.published}
              </p>
            </div>
          </div>
        </div>

        {/* Cancelled Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Annulés</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.cancelled}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/events/new"
            className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <div className="p-2 bg-orange-500 rounded-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Créer un événement</p>
              <p className="text-sm text-gray-500">Ajouter un nouvel événement</p>
            </div>
          </Link>

          <Link
            href="/admin/events?status=DRAFT"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="p-2 bg-gray-500 rounded-lg">
              <FileEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Voir les brouillons</p>
              <p className="text-sm text-gray-500">{stats.draft} en attente</p>
            </div>
          </Link>

          <Link
            href="/admin/events"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Gérer les événements</p>
              <p className="text-sm text-gray-500">Voir tous les événements</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Événements récents
          </h2>
          <Link
            href="/admin/events"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun événement pour le moment</p>
            <Link
              href="/admin/events/new"
              className="text-orange-500 hover:text-orange-600 font-medium mt-2 inline-block"
            >
              Créer votre premier événement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Événement
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Statut
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Capacité
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="font-medium text-gray-900 hover:text-orange-500"
                      >
                        {event.title}
                      </Link>
                      {event.location && (
                        <p className="text-sm text-gray-500">{event.location}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(event.status)}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {event.capacity ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.capacity}
                        </span>
                      ) : (
                        <span className="text-gray-400">Illimitée</span>
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
