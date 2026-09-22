import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface IjazaCertificate {
  id: string;
  studentName: string;
  sheikhName: string;
  sanad: string | null;
  riwaya: string;
  scope: string | null;
  issuedOn: string | null;
  certificateNumber: string | null;
  notes: string | null;
  attachmentPath: string | null;
  createdAt: string;
}

export type IjazaCertificateInput = Omit<IjazaCertificate, 'id' | 'createdAt' | 'attachmentPath'>;

const BUCKET = 'ijaza-docs';

export const useMyIjaza = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<IjazaCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setCertificates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_ijaza_certificates')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setCertificates(
        data.map((r) => ({
          id: r.id,
          studentName: r.student_name,
          sheikhName: r.sheikh_name,
          sanad: r.sanad,
          riwaya: r.riwaya,
          scope: r.scope,
          issuedOn: r.issued_on,
          certificateNumber: r.certificate_number,
          notes: r.notes,
          attachmentPath: r.attachment_path,
          createdAt: r.created_at,
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const addCertificate = async (input: IjazaCertificateInput, file?: File | null) => {
    if (!user) return { error: 'unauthenticated' as const };

    let attachmentPath: string | null = null;
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) return { error: upErr.message };
      attachmentPath = path;
    }

    const { error } = await supabase.from('user_ijaza_certificates').insert({
      user_id: user.id,
      student_name: input.studentName,
      sheikh_name: input.sheikhName,
      sanad: input.sanad,
      riwaya: input.riwaya,
      scope: input.scope,
      issued_on: input.issuedOn,
      certificate_number: input.certificateNumber,
      notes: input.notes,
      attachment_path: attachmentPath,
    });
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  const deleteCertificate = async (id: string, attachmentPath: string | null) => {
    if (attachmentPath) await supabase.storage.from(BUCKET).remove([attachmentPath]);
    const { error } = await supabase.from('user_ijaza_certificates').delete().eq('id', id);
    if (!error) await fetchAll();
    return { error: error?.message ?? null };
  };

  const getAttachmentUrl = async (path: string) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  };

  return { certificates, loading, addCertificate, deleteCertificate, getAttachmentUrl, refresh: fetchAll };
};
