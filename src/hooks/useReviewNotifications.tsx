import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface ReviewItem {
  id: string;
  surahNumber: number;
  verseNumber: number;
  nextReviewDate: Date;
}

export const useReviewNotifications = (
  dueReviews: ReviewItem[],
  onStartReview?: (surahNumber: number, verseNumber: number) => void
) => {
  const notificationPermission = useRef<NotificationPermission>('default');
  const hasNotified = useRef(false);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      notificationPermission.current = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      notificationPermission.current = permission;
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (notificationPermission.current !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'review-reminder',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      if (dueReviews.length > 0 && onStartReview) {
        onStartReview(dueReviews[0].surahNumber, dueReviews[0].verseNumber);
      }
      notification.close();
    };
  }, [dueReviews, onStartReview]);

  // Show toast notification
  const showToastNotification = useCallback(() => {
    if (dueReviews.length === 0) return;

    toast.info(`📚 ${dueReviews.length} verset(s) à réviser`, {
      description: 'La révision espacée renforce ta mémorisation',
      action: onStartReview ? {
        label: 'Réviser maintenant',
        onClick: () => {
          if (dueReviews.length > 0) {
            onStartReview(dueReviews[0].surahNumber, dueReviews[0].verseNumber);
          }
        },
      } : undefined,
      duration: 10000,
    });
  }, [dueReviews, onStartReview]);

  // Check for due reviews and notify
  useEffect(() => {
    if (dueReviews.length > 0 && !hasNotified.current) {
      hasNotified.current = true;

      // Request permission first
      requestPermission().then((granted) => {
        if (granted) {
          showBrowserNotification(
            'Révision du Coran',
            `Tu as ${dueReviews.length} verset(s) à réviser aujourd'hui`
          );
        }
      });

      // Always show toast as well
      showToastNotification();
    }

    // Reset flag when no more reviews
    if (dueReviews.length === 0) {
      hasNotified.current = false;
    }
  }, [dueReviews.length, requestPermission, showBrowserNotification, showToastNotification]);

  // Schedule periodic reminders (every 2 hours if there are pending reviews)
  useEffect(() => {
    if (dueReviews.length === 0) return;

    const interval = setInterval(() => {
      if (dueReviews.length > 0) {
        showToastNotification();
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearInterval(interval);
  }, [dueReviews.length, showToastNotification]);

  return {
    requestPermission,
    showBrowserNotification,
    showToastNotification,
    hasPermission: notificationPermission.current === 'granted',
  };
};
