import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationSettingsProps {
  onRequestPermission: () => Promise<boolean>;
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onRequestPermission,
  className,
}) => {
  const { t } = useLanguage();
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
      toast.success(t.notificationsActivatedToast, {
        description: t.notificationsActivatedDesc,
      });
    } else {
      toast.error(t.notificationsRefusedToast, {
        description: t.notificationsRefusedDesc,
      });
    }
  };

  const notificationsSupported = 'Notification' in window;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          {t.notificationsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!notificationsSupported ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            {t.notificationsNotSupported}
          </div>
        ) : permission === 'granted' ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            {t.notificationsEnabled}
          </div>
        ) : permission === 'denied' ? (
          <div className="text-sm">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <X className="h-4 w-4" />
              {t.notificationsBlocked}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.notificationsBlockedHint}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t.notificationsEnableHint}
            </p>
            <Button 
              onClick={handleEnableNotifications} 
              disabled={requesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {requesting ? t.notificationsActivating : t.enableNotifications}
            </Button>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="toast-notifications" className="text-sm">
              {t.inAppNotifications}
            </Label>
            <Switch id="toast-notifications" defaultChecked disabled />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t.alwaysActiveForReminders}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
