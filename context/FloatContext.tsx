import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppShortcut = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  url: string;
};

export type FloatingItem = {
  id: string;
  appId: string;
  x: number;
  y: number;
  size: number;
};

export type FloatSettings = {
  overlayEnabled: boolean;
  autoLaunch: boolean;
  compactMode: boolean;
  haptics: boolean;
};

const STORAGE_KEY = '@kh-float/state-v1';

export const DEFAULT_APPS: AppShortcut[] = [
  { id: 'browser', name: 'المتصفح', subtitle: 'بحث سريع', icon: 'globe', color: '#4B79A1', url: 'https://www.google.com' },
  { id: 'whatsapp', name: 'واتساب', subtitle: 'محادثاتك', icon: 'message-circle', color: '#3B8D61', url: 'whatsapp://send' },
  { id: 'youtube', name: 'YouTube', subtitle: 'فيديوهات', icon: 'play', color: '#B9433B', url: 'vnd.youtube://' },
  { id: 'phone', name: 'الهاتف', subtitle: 'اتصال سريع', icon: 'phone', color: '#9A7130', url: 'tel:' },
  { id: 'messages', name: 'الرسائل', subtitle: 'SMS', icon: 'message-square', color: '#6D5E9D', url: 'sms:' },
];

const DEFAULT_ITEMS: FloatingItem[] = [
  { id: 'float-browser', appId: 'browser', x: 22, y: 30, size: 82 },
  { id: 'float-whatsapp', appId: 'whatsapp', x: 124, y: 92, size: 92 },
  { id: 'float-youtube', appId: 'youtube', x: 238, y: 44, size: 76 },
];

const DEFAULT_SETTINGS: FloatSettings = {
  overlayEnabled: false,
  autoLaunch: false,
  compactMode: false,
  haptics: true,
};

type StoredState = {
  items: FloatingItem[];
  settings: FloatSettings;
  introSeen: boolean;
};

type FloatContextValue = {
  apps: AppShortcut[];
  floatingItems: FloatingItem[];
  settings: FloatSettings;
  introSeen: boolean;
  hydrated: boolean;
  dismissIntro: () => void;
  toggleFloatingApp: (appId: string) => void;
  clearWorkspace: () => void;
  removeFloatingApp: (itemId: string) => void;
  updateFloatingItem: (itemId: string, patch: Partial<FloatingItem>) => void;
  setSetting: <K extends keyof FloatSettings>(key: K, value: FloatSettings[K]) => void;
  resetWorkspace: () => void;
};

const FloatContext = createContext<FloatContextValue | null>(null);

export function FloatProvider({ children }: { children: React.ReactNode }) {
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>(DEFAULT_ITEMS);
  const [settings, setSettings] = useState<FloatSettings>(DEFAULT_SETTINGS);
  const [introSeen, setIntroSeen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<StoredState>;
        if (saved.items) setFloatingItems(saved.items);
        if (saved.settings) setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        if (saved.introSeen) setIntroSeen(true);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const save = (nextItems: FloatingItem[], nextSettings: FloatSettings, nextIntroSeen: boolean) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: nextItems,
      settings: nextSettings,
      introSeen: nextIntroSeen,
    }));
  };

  const dismissIntro = () => {
    setIntroSeen(true);
    save(floatingItems, settings, true);
  };

  const toggleFloatingApp = (appId: string) => {
    const existing = floatingItems.find((item) => item.appId === appId);
    const next = existing
      ? floatingItems.filter((item) => item.appId !== appId)
      : [...floatingItems, {
        id: `float-${appId}-${Date.now()}`,
        appId,
        x: 28 + (floatingItems.length % 3) * 92,
        y: 32 + (floatingItems.length % 3) * 74,
        size: 82,
      }];
    setFloatingItems(next);
    save(next, settings, introSeen);
  };

  const removeFloatingApp = (itemId: string) => {
    const next = floatingItems.filter((item) => item.id !== itemId);
    setFloatingItems(next);
    save(next, settings, introSeen);
  };

  const clearWorkspace = () => {
    setFloatingItems([]);
    save([], settings, introSeen);
  };

  const updateFloatingItem = (itemId: string, patch: Partial<FloatingItem>) => {
    const next = floatingItems.map((item) => item.id === itemId ? { ...item, ...patch } : item);
    setFloatingItems(next);
    save(next, settings, introSeen);
  };

  const setSetting = <K extends keyof FloatSettings>(key: K, value: FloatSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    save(floatingItems, next, introSeen);
  };

  const resetWorkspace = () => {
    setFloatingItems(DEFAULT_ITEMS);
    setSettings(DEFAULT_SETTINGS);
    save(DEFAULT_ITEMS, DEFAULT_SETTINGS, introSeen);
  };

  const value = useMemo<FloatContextValue>(() => ({
    apps: DEFAULT_APPS,
    floatingItems,
    settings,
    introSeen,
    hydrated,
    dismissIntro,
    toggleFloatingApp,
    clearWorkspace,
    removeFloatingApp,
    updateFloatingItem,
    setSetting,
    resetWorkspace,
  }), [floatingItems, settings, introSeen, hydrated]);

  return <FloatContext.Provider value={value}>{children}</FloatContext.Provider>;
}

export function useFloat() {
  const value = useContext(FloatContext);
  if (!value) throw new Error('useFloat must be used within FloatProvider');
  return value;
}