import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date | null;
}

export const useStreakNotifications = (
  streakData: StreakData | null,
  onStartPractice?: () => void
) => {
  const notificationPermission = useRef<NotificationPermission>('default');
  const dailyReminderSent = useRef(false);
  const lastReminderDate = useRef<string | null>(null);

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

  // Show browser notification for streak reminder
  const showStreakNotification = useCallback((title: string, body: string) => {
    if (notificationPermission.current !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'streak-reminder',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      if (onStartPractice) {
        onStartPractice();
      }
      notification.close();
    };

    return notification;
  }, [onStartPractice]);

  // Check if user has practiced today
  const hasPracticedToday = useCallback(() => {
    if (!streakData?.lastPracticeDate) return false;
    const today = new Date().toDateString();
    const lastPractice = new Date(streakData.lastPracticeDate).toDateString();
    return today === lastPractice;
  }, [streakData]);

  // Get streak motivation message
  const getStreakMessage = useCallback(() => {
    if (!streakData) return { title: '', body: '' };
    
    const { currentStreak } = streakData;
    
    if (currentStreak === 0) {
      return {
        title: '🌟 Commence ta série !',
        body: 'Récite un verset aujourd\'hui pour démarrer ta série de jours consécutifs.'
      };
    } else if (currentStreak >= 30) {
      return {
        title: `🏆 Série de ${currentStreak} jours !`,
        body: 'Mashallah ! Tu es un exemple de dévotion. Continue pour débloquer le badge "Dévotion Ultime" !'
      };
    } else if (currentStreak >= 7) {
      return {
        title: `🔥 ${currentStreak} jours consécutifs !`,
        body: 'Ta persévérance est admirable. Ne brise pas ta série aujourd\'hui !'
      };
    } else if (currentStreak >= 3) {
      return {
        title: `💪 ${currentStreak} jours de suite !`,
        body: 'Bravo ! Continue sur cette lancée pour débloquer le badge "Dévotion" !'
      };
    } else {
      return {
        title: `⭐ Série de ${currentStreak} jour(s)`,
        body: 'Chaque jour compte. Pratique maintenant pour maintenir ta série !'
      };
    }
  }, [streakData]);

  // Show toast for streak reminder
  const showStreakToast = useCallback(() => {
    if (hasPracticedToday()) return;
    
    const { title, body } = getStreakMessage();
    
    toast.info(title, {
      description: body,
      action: onStartPractice ? {
        label: 'Pratiquer',
        onClick: onStartPractice,
      } : undefined,
      duration: 15000,
    });
  }, [hasPracticedToday, getStreakMessage, onStartPractice]);

  // Send daily reminder notification
  const sendDailyReminder = useCallback(() => {
    const today = new Date().toDateString();
    
    // Don't send multiple reminders on the same day
    if (lastReminderDate.current === today) return;
    
    // Don't remind if already practiced today
    if (hasPracticedToday()) return;

    lastReminderDate.current = today;
    
    const { title, body } = getStreakMessage();
    
    // Browser notification
    requestPermission().then((granted) => {
      if (granted) {
        showStreakNotification(title, body);
      }
    });

    // Toast notification
    showStreakToast();
  }, [hasPracticedToday, getStreakMessage, requestPermission, showStreakNotification, showStreakToast]);

  // Schedule reminders at specific times
  useEffect(() => {
    if (!streakData) return;

    // Check immediately on load
    const now = new Date();
    const hour = now.getHours();

    // Morning reminder (8am-10am)
    if (hour >= 8 && hour < 10 && !hasPracticedToday()) {
      sendDailyReminder();
    }

    // Set up interval to check every hour
    const interval = setInterval(() => {
      const currentHour = new Date().getHours();
      
      // Reminder times: 8am, 12pm, 6pm, 9pm
      const reminderHours = [8, 12, 18, 21];
      
      if (reminderHours.includes(currentHour) && !hasPracticedToday()) {
        sendDailyReminder();
      }
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [streakData, hasPracticedToday, sendDailyReminder]);

  // Warning when streak is about to break (after 8pm if not practiced)
  useEffect(() => {
    if (!streakData || streakData.currentStreak === 0) return;
    
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 20 && !hasPracticedToday() && !dailyReminderSent.current) {
      dailyReminderSent.current = true;
      
      toast.warning(`⚠️ Attention ! Ta série de ${streakData.currentStreak} jours va se terminer !`, {
        description: 'Il ne te reste que quelques heures pour pratiquer et maintenir ta série.',
        action: onStartPractice ? {
          label: 'Sauver ma série',
          onClick: onStartPractice,
        } : undefined,
        duration: 30000,
      });

      requestPermission().then((granted) => {
        if (granted) {
          showStreakNotification(
            `⚠️ Série en danger !`,
            `Ta série de ${streakData.currentStreak} jours va se terminer à minuit. Pratique maintenant !`
          );
        }
      });
    }

    // Reset the flag at midnight
    const resetTime = new Date();
    resetTime.setHours(0, 0, 0, 0);
    resetTime.setDate(resetTime.getDate() + 1);
    
    const timeUntilMidnight = resetTime.getTime() - now.getTime();
    const resetTimeout = setTimeout(() => {
      dailyReminderSent.current = false;
      lastReminderDate.current = null;
    }, timeUntilMidnight);

    return () => clearTimeout(resetTimeout);
  }, [streakData, hasPracticedToday, onStartPractice, requestPermission, showStreakNotification]);

  return {
    requestPermission,
    showStreakNotification,
    showStreakToast,
    sendDailyReminder,
    hasPermission: notificationPermission.current === 'granted',
    hasPracticedToday: hasPracticedToday(),
  };
};
