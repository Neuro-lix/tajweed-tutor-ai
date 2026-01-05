import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  onRequestPermission: () => Promise<boolean>;
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onRequestPermission,
  className,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setRequesting(true);
    const granted = await onRequestPermission();
    setPermission(granted ? 'granted' : 'denied');
    setRequesting(false);

    if (granted) {
      toast.success('Notifications activées !', {
        description: 'Tu recevras des rappels pour tes révisions',
      });
    } else {
      toast.error('Notifications refusées', {
        description: 'Tu peux les activer dans les paramètres de ton navigateur',
      });
    }
  };

  const notificationsSupported = 'Notification' in window;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!notificationsSupported ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            Notifications non supportées par ce navigateur
          </div>
        ) : permission === 'granted' ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            Notifications activées
          </div>
        ) : permission === 'denied' ? (
          <div className="text-sm">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <X className="h-4 w-4" />
              Notifications bloquées
            </div>
            <p className="text-muted-foreground text-xs">
              Pour les activer, modifie les paramètres de ton navigateur pour ce site.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Active les notifications pour recevoir des rappels de révision.
            </p>
            <Button 
              onClick={handleEnableNotifications} 
              disabled={requesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {requesting ? 'Activation...' : 'Activer les notifications'}
            </Button>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="toast-notifications" className="text-sm">
              Notifications dans l'app
            </Label>
            <Switch id="toast-notifications" defaultChecked disabled />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Toujours activées pour les rappels importants
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
