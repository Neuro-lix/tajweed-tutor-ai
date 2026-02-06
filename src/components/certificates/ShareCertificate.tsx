import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Facebook, Linkedin, Copy, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SURAHS } from '@/data/quranData';

interface ShareCertificateProps {
  certificateId: string;
  surahNumber: number;
  userName: string;
  averageScore: number;
}

export const ShareCertificate: React.FC<ShareCertificateProps> = ({
  certificateId,
  surahNumber,
  userName,
  averageScore,
}) => {
  const [copied, setCopied] = useState(false);
  const surah = SURAHS.find((s) => s.id === surahNumber);

  const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
  
  const shareText = `🎉 J'ai maîtrisé la sourate ${surah?.transliteration || surahNumber} avec un score de ${averageScore.toFixed(0)}% sur Tajweed Tutor AI ! Vérifiez mon certificat :`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Impossible de copier le lien');
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verificationUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verificationUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${verificationUrl}`)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificat - ${surah?.transliteration}`,
          text: shareText,
          url: verificationUrl,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  // If native share is available, use it
  if (navigator.share) {
    return (
      <Button variant="outline" size="sm" onClick={handleNativeShare}>
        <Share2 className="w-4 h-4 mr-2" />
        Partager
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShareFacebook}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareLinkedIn}>
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copier le lien
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
