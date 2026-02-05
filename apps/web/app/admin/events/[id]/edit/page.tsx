'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Event } from '@/lib/types';
import { Loader2, AlertCircle } from 'lucide-react';
import EventForm from '../../components/EventForm';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const data = await api.getEvent(eventId);
        setEvent(data.event);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load event';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
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
            <h2 className="text-lg font-semibold text-red-700">
              Error Loading Event
            </h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Event not found
  if (!event) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-yellow-700">
              Event Not Found
            </h2>
          </div>
          <p className="text-yellow-600 mb-4">
            The event you are looking for does not exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/admin/events')}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return <EventForm mode="edit" event={event} />;
}
