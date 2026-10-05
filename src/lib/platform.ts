import { Capacitor } from '@capacitor/core';

/** True only inside the native Capacitor app (never in a browser). */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** True only inside the native Android app. Purchase UI is hidden there (Google Play policy). */
export const isAndroidApp = (): boolean => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
