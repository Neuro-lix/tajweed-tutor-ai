import React from 'react';
import { X, CheckCircle, BookOpen, Bitcoin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductPreviewProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    icon: string;
    price: number;
    description: string;
    bullets: string[];
    contents: string;
    pages?: { name: string }[];
    totalPages?: number;
  };
  onPaypal: () => void;
  onCrypto: () => void;
  cryptoLoading: boolean;
}

const ProductPreviewModal: React.FC<ProductPreviewProps> = ({
  open, onClose, product, onPaypal, onCrypto, cryptoLoading
}) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{product.icon}</span>
              <div>
                <DialogTitle className="text-xl font-serif text-primary-foreground">{product.name}</DialogTitle>
                <p className="text-primary-foreground/80 text-sm mt-1">{product.description}</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[55vh]">
          <div className="p-6 space-y-5">
            {/* Bullets */}
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Ce que vous obtenez
              </h4>
              <ul className="space-y-2">
                {product.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contents */}
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">{product.contents}</p>
            </div>

            {/* Pages grid for workbooks */}
            {product.pages && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-foreground text-sm">Contenu du livret</h4>
                  {product.totalPages && (
                    <Badge variant="secondary" className="text-xs">{product.totalPages} pages</Badge>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {product.pages.map((p, i) => (
                    <div key={i} className="aspect-[3/4] rounded-lg bg-muted border border-border flex items-center justify-center p-1">
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <div className="text-center text-2xl font-bold text-foreground mb-2">{product.price.toFixed(2)}€</div>
          <Button size="lg" className="w-full rounded-2xl" onClick={onPaypal}>
            PayPal
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-2xl border-2 border-border hover:border-primary"
            onClick={onCrypto}
            disabled={cryptoLoading}
          >
            {cryptoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bitcoin className="h-4 w-4 mr-2" />}
            Crypto
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">BTC · ETH · USDT · +150 cryptos</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewModal;
