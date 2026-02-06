'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Registration, RegistrationStatus, Event } from '@/lib/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
} from 'lucide-react';

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const styles = {
    PENDING: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: Clock,
      label: 'En attente',
    },
    CONFIRMED: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: CheckCircle,
      label: 'Confirmé',
    },
    CANCELLED: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: XCircle,
      label: 'Refusé',
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<RegistrationStatus | 'ALL'>('ALL');

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

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, registrationsRes] = await Promise.all([
          api.getEvent(eventId),
          api.getEventRegistrations(eventId),
        ]);
        setEvent(eventRes.event);
        setRegistrations(registrationsRes.registrations);
      } catch {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId]);

  const handleConfirm = async (registration: Registration) => {
    setModalConfig({
      isOpen: true,
      title: 'Confirmer la réservation',
      message: `Voulez-vous confirmer la réservation de ${registration.user.fullname} ?`,
      type: 'success',
      confirmLabel: 'Confirmer',
      onConfirm: async () => {
        closeModal();
        setActionLoading(registration.id);
        try {
          const { registration: updated } = await api.confirmRegistration(registration.id);
          setRegistrations((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
          );
        } catch (err) {
          const apiError = err as { message: string };
          setError(apiError.message || 'Erreur lors de la confirmation');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleReject = async (registration: Registration) => {
    setModalConfig({
      isOpen: true,
      title: 'Refuser la réservation',
      message: `Voulez-vous refuser la réservation de ${registration.user.fullname} ?`,
      type: 'danger',
      confirmLabel: 'Refuser',
      onConfirm: async () => {
        closeModal();
        setActionLoading(registration.id);
        try {
          const { registration: updated } = await api.rejectRegistration(registration.id);
          setRegistrations((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
          );
        } catch (err) {
          const apiError = err as { message: string };
          setError(apiError.message || 'Erreur lors du refus');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const filteredRegistrations = registrations.filter((r) =>
    filter === 'ALL' ? true : r.status === filter
  );

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === 'PENDING').length,
    confirmed: registrations.filter((r) => r.status === 'CONFIRMED').length,
    cancelled: registrations.filter((r) => r.status === 'CANCELLED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/events"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
          {event && (
            <p className="text-gray-500 mt-1">{event.title}</p>
          )}
        </div>
      </div>

      {/* Event Info Card */}
      {event && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {stats.confirmed} / {event.capacity} places confirmées
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-sm text-amber-600">En attente</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-sm text-green-600">Confirmées</p>
          <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-sm text-red-600">Refusées</p>
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === status
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {status === 'ALL' && 'Toutes'}
            {status === 'PENDING' && `En attente (${stats.pending})`}
            {status === 'CONFIRMED' && `Confirmées (${stats.confirmed})`}
            {status === 'CANCELLED' && `Refusées (${stats.cancelled})`}
          </button>
        ))}
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Participant
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Date de demande
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-semibold">
                          {registration.user.fullname.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {registration.user.fullname}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{registration.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(registration.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={registration.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {registration.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleConfirm(registration)}
                              disabled={actionLoading === registration.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Confirmer"
                            >
                              {actionLoading === registration.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(registration)}
                              disabled={actionLoading === registration.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Refuser"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {registration.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleReject(registration)}
                            disabled={actionLoading === registration.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            title="Annuler"
                          >
                            {actionLoading === registration.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        {registration.status === 'CANCELLED' && (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onCancel={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmLabel={modalConfig.confirmLabel}
      />
    </div>
  );
}
