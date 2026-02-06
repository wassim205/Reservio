'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Event, CreateEventInput, UpdateEventInput, VALIDATION } from '@/lib/types';
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  Type,
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface EventFormProps {
  event?: Event; // If provided, we're editing
  mode: 'create' | 'edit';
}

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  capacity?: string;
  general?: string;
}

export default function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    startDate: event?.startDate ? formatDateForInput(event.startDate) : '',
    endDate: event?.endDate ? formatDateForInput(event.endDate) : '',
    capacity: event?.capacity?.toString() || '',
  });

  // Format ISO date to datetime-local input format
  function formatDateForInput(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toISOString().slice(0, 16);
  }

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const { event: eventValidation } = VALIDATION;

    // Title
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (
      formData.title.length < eventValidation.title.minLength ||
      formData.title.length > eventValidation.title.maxLength
    ) {
      newErrors.title = eventValidation.title.message;
    }

    // Description
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (
      formData.description.length < eventValidation.description.minLength ||
      formData.description.length > eventValidation.description.maxLength
    ) {
      newErrors.description = eventValidation.description.message;
    }

    // Location
    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu est requis';
    } else if (formData.location.length > eventValidation.location.maxLength) {
      newErrors.location = eventValidation.location.message;
    }

    // Start date
    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    } else if (new Date(formData.startDate) < new Date()) {
      newErrors.startDate = 'La date de début ne peut pas être dans le passé';
    }

    // End date
    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'La date de fin doit être après la date de début';
    }

    // Capacity
    const capacity = parseInt(formData.capacity, 10);
    if (!formData.capacity || isNaN(capacity)) {
      newErrors.capacity = 'La capacité est requise';
    } else if (capacity < eventValidation.capacity.min) {
      newErrors.capacity = eventValidation.capacity.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const eventData: CreateEventInput | UpdateEventInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: parseInt(formData.capacity, 10),
      };

      if (mode === 'create') {
        await api.createEvent(eventData as CreateEventInput);
      } else if (event) {
        await api.updateEvent(event.id, eventData as UpdateEventInput);
      }

      router.push('/admin/events');
    } catch (err) {
      const error = err as { message?: string | string[] };
      const message = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message || 'Une erreur est survenue';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
          {mode === 'create' ? 'Nouvel événement' : 'Modifier l\'événement'}
        </h1>
        <p className="text-gray-500 mt-1">
          {mode === 'create'
            ? 'Créez un nouvel événement (il sera enregistré comme brouillon)'
            : 'Modifiez les informations de l\'événement'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="block mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Type className="w-4 h-4 text-orange-500" />
              Titre de l&apos;événement
            </span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Conférence Tech 2026"
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title}</p>
            )}
          </label>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="block mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Description
            </span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Décrivez votre événement en détail..."
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            />
            <div className="flex justify-between mt-2">
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400">
                {formData.description.length}/2000
              </span>
            </div>
          </label>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="block mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Lieu
            </span>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ex: Centre de conférences, Casablanca"
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            />
            {errors.location && (
              <p className="mt-2 text-sm text-red-600">{errors.location}</p>
            )}
          </label>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start date */}
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Date de début
              </span>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                  errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              />
              {errors.startDate && (
                <p className="mt-2 text-sm text-red-600">{errors.startDate}</p>
              )}
            </label>

            {/* End date */}
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                Date de fin
              </span>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                  errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              />
              {errors.endDate && (
                <p className="mt-2 text-sm text-red-600">{errors.endDate}</p>
              )}
            </label>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="block mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-4 h-4 text-orange-500" />
              Capacité (nombre de places)
            </span>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              placeholder="Ex: 100"
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            />
            {errors.capacity && (
              <p className="mt-2 text-sm text-red-600">{errors.capacity}</p>
            )}
          </label>
        </div>

        {/* Submit buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
          <Link
            href="/admin/events"
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all text-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {mode === 'create' ? 'Création...' : 'Mise à jour...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {mode === 'create' ? 'Créer l\'événement' : 'Enregistrer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
