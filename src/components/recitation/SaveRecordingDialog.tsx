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
import { useLanguage } from '@/contexts/LanguageContext';

interface SaveRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  surahName?: string;
  verseNumber?: number;
}

export const SaveRecordingDialog: React.FC<SaveRecordingDialogProps> = ({
  open, onOpenChange, onSave, onDiscard, surahName, verseNumber,
}) => {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.keepRecitation}</AlertDialogTitle>
          <AlertDialogDescription>
            {surahName && verseNumber
              ? `${t.justRecited} ${surahName}, ${t.verse} ${verseNumber}.`
              : `${t.justRecited}.`}
            <br /><br />
            {t.saveForLater}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} className="gap-2">
            <Trash2 className="h-4 w-4" />
            {t.noDiscard}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onSave} className="gap-2">
            <Download className="h-4 w-4" />
            {t.yesKeep}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
