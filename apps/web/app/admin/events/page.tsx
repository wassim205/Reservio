'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event, EventStatus } from '@/lib/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Send,
  XCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Status badge component
function StatusBadge({ status }: { status: EventStatus }) {
  const styles = {
    DRAFT: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: Clock,
      label: 'Brouillon',
    },
    PUBLISHED: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: CheckCircle,
      label: 'Publié',
    },
    CANCELLED: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: XCircle,
      label: 'Annulé',
    },
  };

  const style = styles[status];
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </span>
  );
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'success' | 'danger';
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmLabel: 'Confirmer',
    onConfirm: () => {},
  });

  // Close modal helper
  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Load events
  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const response = await api.getEvents(status);
      setEvents(response.events);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des événements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Publish event
  const handlePublish = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Publier l\'événement',
      message: 'Êtes-vous sûr de vouloir publier cet événement ? Il sera visible par tous les utilisateurs.',
      type: 'success',
      confirmLabel: 'Publier',
      onConfirm: async () => {
        closeModal();
        try {
          setActionLoading(id);
          await api.publishEvent(id);
          await loadEvents();
        } catch (err) {
          console.error(err);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Cancel event
  const handleCancel = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Annuler l\'événement',
      message: 'Êtes-vous sûr de vouloir annuler cet événement ? Les participants seront notifiés.',
      type: 'warning',
      confirmLabel: 'Annuler l\'événement',
      onConfirm: async () => {
        closeModal();
        try {
          setActionLoading(id);
          await api.cancelEvent(id);
          await loadEvents();
        } catch (err) {
          console.error(err);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Delete event
  const handleDelete = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Supprimer l\'événement',
      message: 'Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.',
      type: 'danger',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        closeModal();
        try {
          setActionLoading(id);
          await api.deleteEvent(id);
          await loadEvents();
        } catch (err) {
          console.error(err);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Filter events by search
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmLabel={modalConfig.confirmLabel}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      <div className="space-y-6">
        {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Événements</h1>
          <p className="text-gray-500 mt-1">Gérez vos événements</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Nouvel événement
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as EventStatus | 'ALL')}
            className="pl-12 pr-8 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DRAFT">Brouillons</option>
            <option value="PUBLISHED">Publiés</option>
            <option value="CANCELLED">Annulés</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Aucun événement trouvé
          </h3>
          <p className="text-gray-500 mb-6">
            {search
              ? 'Aucun événement ne correspond à votre recherche'
              : 'Commencez par créer votre premier événement'}
          </p>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Créer un événement
          </Link>
        </div>
      ) : (
        /* Events grid */
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {event.title}
                    </h3>
                    <StatusBadge status={event.status} />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.startDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {event.capacity} places
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View */}
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Voir"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>

                  {/* Edit (only draft) */}
                  {event.status === 'DRAFT' && (
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="p-2.5 rounded-xl text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                  )}

                  {/* Publish (only draft) */}
                  {event.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(event.id)}
                      disabled={actionLoading === event.id}
                      className="p-2.5 rounded-xl text-green-500 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Publier"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}

                  {/* Cancel (draft or published) */}
                  {event.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancel(event.id)}
                      disabled={actionLoading === event.id}
                      className="p-2.5 rounded-xl text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Annuler"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}

                  {/* Delete (only draft or cancelled) */}
                  {event.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={actionLoading === event.id}
                      className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
