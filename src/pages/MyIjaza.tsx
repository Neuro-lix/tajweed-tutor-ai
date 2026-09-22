import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Award, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageSeo } from '@/components/seo/PageSeo';
import { QIRAAT_NAMES } from '@/data/quranData';
import { useMyIjaza, type IjazaCertificateInput } from '@/hooks/useMyIjaza';
import { generateIjazaPDF } from '@/utils/ijazaPdf';

const emptyForm: IjazaCertificateInput = {
  studentName: '',
  sheikhName: '',
  sanad: '',
  riwaya: 'hafs_asim',
  scope: '',
  issuedOn: '',
  certificateNumber: '',
  notes: '',
};

const MyIjaza = () => {
  const navigate = useNavigate();
  const { certificates, loading, addCertificate, deleteCertificate, getAttachmentUrl } = useMyIjaza();
  const [form, setForm] = useState<IjazaCertificateInput>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof IjazaCertificateInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.sheikhName.trim()) {
      toast.error('Nom de l\'étudiant et nom du cheikh sont requis.');
      return;
    }
    setSaving(true);
    const { error } = await addCertificate(
      { ...form, issuedOn: form.issuedOn || null },
      file,
    );
    setSaving(false);
    if (error) {
      toast.error("Enregistrement impossible pour le moment.");
      return;
    }
    toast.success('Ijāza enregistrée.');
    setForm(emptyForm);
    setFile(null);
    setOpen(false);
  };

  const openAttachment = async (path: string) => {
    const url = await getAttachmentUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('Document indisponible.');
  };

  const riwayat = Object.entries(QIRAAT_NAMES);

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Mes ijāzas — parcours et certificats"
        description="Enregistrez vos ijāzas obtenues auprès de vos cheikhs, leur chaîne de transmission et suivez votre parcours."
        path="/mes-ijazas"
      />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-2">
              <Award className="h-7 w-7 text-primary" /> Mes ijāzas
            </h1>
            <p className="text-muted-foreground mt-1">
              Vos certificats obtenus auprès de vos cheikhs, avec leur chaîne de transmission.
            </p>
          </div>
          <Button onClick={() => setOpen((o) => !o)} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter une ijāza
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Ijāzas enregistrées</p>
            <p className="text-3xl font-semibold">{certificates.length}</p>
          </CardContent></Card>
          <Card><CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Riwāyāt couvertes</p>
            <p className="text-3xl font-semibold">{new Set(certificates.map((c) => c.riwaya)).size}</p>
          </CardContent></Card>
          <Card><CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Cheikhs</p>
            <p className="text-3xl font-semibold">{new Set(certificates.map((c) => c.sheikhName)).size}</p>
          </CardContent></Card>
        </div>

        {open && (
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle ijāza</CardTitle>
              <CardDescription>
                Indiquez la chaîne de transmission telle qu'elle figure sur votre certificat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Nom de l'étudiant</Label>
                  <Input id="student" value={form.studentName} onChange={(e) => set('studentName', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheikh">Nom du cheikh</Label>
                  <Input id="sheikh" value={form.sheikhName} onChange={(e) => set('sheikhName', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riwaya">Riwāya / lecture</Label>
                  <Select value={form.riwaya} onValueChange={(v) => set('riwaya', v)}>
                    <SelectTrigger id="riwaya"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {riwayat.map(([id, label]) => (
                        <SelectItem key={id} value={id}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issued">Date de délivrance</Label>
                  <Input id="issued" type="date" value={form.issuedOn ?? ''} onChange={(e) => set('issuedOn', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Portée</Label>
                  <Input id="scope" placeholder="Coran complet, juz 30, sourate…" value={form.scope ?? ''} onChange={(e) => set('scope', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num">Numéro du certificat</Label>
                  <Input id="num" value={form.certificateNumber ?? ''} onChange={(e) => set('certificateNumber', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sanad">Chaîne de transmission (sanad) jusqu'au Prophète ﷺ</Label>
                  <Textarea
                    id="sanad"
                    rows={4}
                    placeholder="Cheikh … ʿan … ʿan … jusqu'au Messager d'Allah ﷺ"
                    value={form.sanad ?? ''}
                    onChange={(e) => set('sanad', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="file">Document (PDF ou photo, privé)</Label>
                  <Input id="file" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : certificates.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            Aucune ijāza enregistrée pour le moment.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {certificates.map((c) => (
              <Card key={c.id}>
                <CardContent className="py-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">{c.sheikhName}</p>
                      <p className="text-sm text-muted-foreground">{c.studentName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{QIRAAT_NAMES[c.riwaya] ?? c.riwaya}</Badge>
                      {c.issuedOn && <Badge variant="secondary">{new Date(c.issuedOn).toLocaleDateString('fr-FR')}</Badge>}
                    </div>
                  </div>
                  {c.scope && <p className="text-sm">{c.scope}</p>}
                  {c.sanad && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap border-l-2 border-primary/40 pl-3">
                      {c.sanad}
                    </p>
                  )}
                  {c.notes && <p className="text-sm text-muted-foreground italic">{c.notes}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => generateIjazaPDF(c)}>
                      <Download className="h-4 w-4" /> Télécharger l'attestation
                    </Button>
                    {c.attachmentPath && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openAttachment(c.attachmentPath!)}>
                        <FileText className="h-4 w-4" /> Voir le document
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={async () => {
                        const { error } = await deleteCertificate(c.id, c.attachmentPath);
                        if (error) toast.error('Suppression impossible.');
                        else toast.success('Ijāza supprimée.');
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyIjaza;
