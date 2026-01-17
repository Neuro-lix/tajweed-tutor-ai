import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Sheikh {
  id: string;
  name: string;
  specialty: string | null;
  languages: string[];
  bio: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface AvailabilitySlot {
  id: string;
  sheikhId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface IjazaRequest {
  id: string;
  sheikhId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  preferredLanguage: string;
  preferredTime: string | null;
  experience: string | null;
  motivation: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'completed';
  scheduledDate: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface CreateIjazaRequest {
  sheikhId?: string;
  fullName: string;
  email: string;
  phone?: string;
  preferredLanguage?: string;
  preferredTime?: string;
  experience?: string;
  motivation?: string;
  slotId?: string;
}

export const useIjaza = () => {
  const { user } = useAuth();
  const [sheikhs, setSheikhs] = useState<Sheikh[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [myRequests, setMyRequests] = useState<IjazaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: sheikhData } = await supabase.from('sheikhs').select('*').order('name');
      if (sheikhData) {
        setSheikhs(sheikhData.map((s: any) => ({
          id: s.id, name: s.name, specialty: s.specialty, languages: s.languages || [],
          bio: s.bio, imageUrl: s.image_url, isAvailable: s.is_available,
        })));
      }

      const { data: availData } = await supabase.from('sheikh_availability').select('*').eq('is_booked', false).order('day_of_week').order('start_time');
      if (availData) {
        setAvailability(availData.map((a: any) => ({
          id: a.id, sheikhId: a.sheikh_id, dayOfWeek: a.day_of_week,
          startTime: a.start_time, endTime: a.end_time, isBooked: a.is_booked,
        })));
      }

      if (user) {
        const { data: requestData } = await supabase.from('ijaza_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (requestData) {
          setMyRequests(requestData.map((r: any) => ({
            id: r.id, sheikhId: r.sheikh_id, fullName: r.full_name, email: r.email,
            phone: r.phone, preferredLanguage: r.preferred_language, preferredTime: r.preferred_time,
            experience: r.experience, motivation: r.motivation, status: r.status as IjazaRequest['status'],
            scheduledDate: r.scheduled_date, rejectionReason: r.rejection_reason, createdAt: r.created_at,
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching ijaza data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSheikhAvailability = (sheikhId: string) => availability.filter((a) => a.sheikhId === sheikhId);
  const getDayName = (dayOfWeek: number) => ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek];
  const formatTime = (time: string) => time.substring(0, 5);

  const submitRequest = async (request: CreateIjazaRequest) => {
    if (!user) { toast.error('Vous devez être connecté'); return null; }
    try {
      const { data, error } = await supabase.from('ijaza_requests').insert({
        user_id: user.id, sheikh_id: request.sheikhId || null, full_name: request.fullName,
        email: request.email, phone: request.phone || null, preferred_language: request.preferredLanguage || 'ar',
        preferred_time: request.preferredTime || null, experience: request.experience || null, motivation: request.motivation || null,
      }).select().single();
      if (error) throw error;
      if (request.slotId) {
        await supabase.from('sheikh_availability').update({ is_booked: true, booked_by: user.id }).eq('id', request.slotId);
      }
      const newRequest: IjazaRequest = {
        id: data.id, sheikhId: data.sheikh_id, fullName: data.full_name, email: data.email, phone: data.phone,
        preferredLanguage: data.preferred_language, preferredTime: data.preferred_time, experience: data.experience,
        motivation: data.motivation, status: data.status as IjazaRequest['status'], scheduledDate: data.scheduled_date,
        rejectionReason: data.rejection_reason, createdAt: data.created_at,
      };
      setMyRequests((prev) => [newRequest, ...prev]);
      toast.success('Demande d\'Ijaza envoyée !');
      return newRequest;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'envoi');
      return null;
    }
  };

  const getStatusLabel = (status: IjazaRequest['status']) => ({ pending: 'En attente', approved: 'Approuvée', rejected: 'Refusée', scheduled: 'Planifiée', completed: 'Terminée' }[status]);
  const getStatusColor = (status: IjazaRequest['status']) => ({ pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', scheduled: 'bg-blue-100 text-blue-700', completed: 'bg-primary/10 text-primary' }[status]);

  return { sheikhs, availability, myRequests, loading, getSheikhAvailability, getDayName, formatTime, submitRequest, getStatusLabel, getStatusColor, refetch: fetchData };
};
