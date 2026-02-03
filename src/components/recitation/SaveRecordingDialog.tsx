import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Trash2 } from 'lucide-react';

interface SaveRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  surahName?: string;
  verseNumber?: number;
}

export const SaveRecordingDialog: React.FC<SaveRecordingDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  surahName,
  verseNumber,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Garder cette récitation ?</AlertDialogTitle>
          <AlertDialogDescription>
            {surahName && verseNumber
              ? `Tu viens de réciter ${surahName}, verset ${verseNumber}.`
              : 'Tu viens de terminer une récitation.'}
            <br />
            <br />
            Veux-tu la sauvegarder pour pouvoir la réécouter et la télécharger plus tard ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Non, supprimer
          </AlertDialogCancel>
          <AlertDialogAction onClick={onSave} className="gap-2">
            <Download className="h-4 w-4" />
            Oui, garder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
