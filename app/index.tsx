import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Tab = 'home' | 'settings';
type BubbleSize = 'small' | 'medium' | 'large';

type Shortcut = {
  id: string;
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  url: string;
  enabled: boolean;
};

const STORAGE = {
  intro: '@kh/intro-seen',
  bubble: '@kh/bubble-enabled',
  size: '@kh/bubble-size',
  shortcuts: '@kh/shortcuts',
};

const shortcutSeed: Shortcut[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    label: 'واتساب',
    icon: 'logo-whatsapp',
    color: '#52B788',
    url: 'whatsapp://',
    enabled: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    label: 'يوتيوب',
    icon: 'logo-youtube',
    color: '#E14B42',
    url: 'youtube://',
    enabled: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    label: 'تلغرام',
    icon: 'paper-plane',
    color: '#4B9DD7',
    url: 'tg://',
    enabled: true,
  },
  {
    id: 'browser',
    name: 'Browser',
    label: 'المتصفح',
    icon: 'globe-outline',
    color: '#D7A33D',
    url: 'https://www.google.com',
    enabled: true,
  },
];

const sizes: { id: BubbleSize; label: string; value: string }[] = [
  { id: 'small', label: 'صغير', value: '56' },
  { id: 'medium', label: 'متوسط', value: '68' },
  { id: 'large', label: 'كبير', value: '82' },
];

function BubblePreview({
  enabled,
  size,
  onPress,
  colors,
}: {
  enabled: boolean;
  size: BubbleSize;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dimension = Number(sizes.find((item) => item.id === size)?.value ?? 68);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 0.94,
          useNativeDriver: true,
          speed: 30,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) onPress();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={bubbleStyles.bubbleStage}>
      <View style={[bubbleStyles.stageHint, { borderColor: colors.border }]}>
        <MaterialCommunityIcons name="gesture-swipe" size={18} color={colors.mutedForeground} />
        <Text style={[bubbleStyles.stageHintText, { color: colors.mutedForeground }]}>
          اسحب الفقّاعة وجرب الضغط عليها
        </Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          bubbleStyles.bubble,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: enabled ? colors.primary : colors.muted,
            shadowColor: colors.primary,
            opacity: enabled ? 1 : 0.45,
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
          },
        ]}
      >
        <Text style={[bubbleStyles.bubbleLetters, { color: colors.primaryForeground }]}>KH</Text>
        <View style={[bubbleStyles.bubbleDot, { backgroundColor: enabled ? colors.success : colors.mutedForeground }]} />
      </Animated.View>
      <Text style={[bubbleStyles.previewCaption, { color: colors.mutedForeground }]}>
        {enabled ? 'جاهزة للظهور فوق التطبيقات' : 'الفقّاعة متوقفة'}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [introVisible, setIntroVisible] = useState(false);
  const [bubbleEnabled, setBubbleEnabled] = useState(true);
  const [bubbleSize, setBubbleSize] = useState<BubbleSize>('medium');
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(shortcutSeed);
  const [reduceMotion, setReduceMotion] = useState(false);

  const stylesWithColors = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem(STORAGE.intro),
      AsyncStorage.getItem(STORAGE.bubble),
      AsyncStorage.getItem(STORAGE.size),
      AsyncStorage.getItem(STORAGE.shortcuts),
    ]).then(([intro, bubble, size, savedShortcuts]) => {
      if (!mounted) return;
      if (!intro) setIntroVisible(true);
      if (bubble !== null) setBubbleEnabled(bubble === 'true');
      if (size === 'small' || size === 'medium' || size === 'large') setBubbleSize(size);
      if (savedShortcuts) {
        try {
          const parsed = JSON.parse(savedShortcuts) as Shortcut[];
          if (Array.isArray(parsed)) setShortcuts(parsed);
        } catch {
          setShortcuts(shortcutSeed);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const setBubble = (value: boolean) => {
    haptic();
    setBubbleEnabled(value);
    void AsyncStorage.setItem(STORAGE.bubble, String(value));
  };

  const setSize = (value: BubbleSize) => {
    haptic();
    setBubbleSize(value);
    void AsyncStorage.setItem(STORAGE.size, value);
  };

  const toggleShortcut = (id: string) => {
    haptic();
    const updated = shortcuts.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item));
    setShortcuts(updated);
    void AsyncStorage.setItem(STORAGE.shortcuts, JSON.stringify(updated));
  };

  const openShortcut = async (shortcut: Shortcut) => {
    haptic();
    try {
      const supported = await Linking.canOpenURL(shortcut.url);
      if (!supported) {
        Alert.alert('التطبيق غير موجود', `ثبّت ${shortcut.name} على هاتفك ثم حاول مرة أخرى.`);
        return;
      }
      await Linking.openURL(shortcut.url);
    } catch {
      Alert.alert('تعذر الفتح', 'لم نتمكن من فتح هذا التطبيق على جهازك.');
    }
  };

  const closeIntro = () => {
    haptic();
    setIntroVisible(false);
    void AsyncStorage.setItem(STORAGE.intro, 'true');
  };

  const resetPreferences = () => {
    Alert.alert('إعادة الإعدادات', 'سيتم إرجاع الإعدادات إلى الوضع الافتراضي.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إعادة',
        style: 'destructive',
        onPress: () => {
          setBubbleEnabled(true);
          setBubbleSize('medium');
          setReduceMotion(false);
          setShortcuts(shortcutSeed);
          void Promise.all([
            AsyncStorage.setItem(STORAGE.bubble, 'true'),
            AsyncStorage.setItem(STORAGE.size, 'medium'),
            AsyncStorage.setItem(STORAGE.shortcuts, JSON.stringify(shortcutSeed)),
          ]);
        },
      },
    ]);
  };

  const enabledShortcuts = shortcuts.filter((item) => item.enabled);

  return (
    <View style={[stylesWithColors.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[stylesWithColors.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={stylesWithColors.header}>
          <View>
            <Text style={stylesWithColors.eyebrow}>KH FLOATING HUB</Text>
            <Text style={stylesWithColors.headerTitle}>{tab === 'home' ? 'مساحتك السريعة' : 'تخصيص التجربة'}</Text>
          </View>
          <View style={stylesWithColors.logo}>
            <Text style={stylesWithColors.logoText}>KH</Text>
          </View>
        </View>

        <View style={stylesWithColors.segmented}>
          <Pressable
            onPress={() => setTab('home')}
            style={[stylesWithColors.segment, tab === 'home' && stylesWithColors.segmentActive]}
            testID="home-tab"
          >
            <Ionicons name="sparkles-outline" size={17} color={tab === 'home' ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[stylesWithColors.segmentText, tab === 'home' && stylesWithColors.segmentTextActive]}>الرئيسية</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('settings')}
            style={[stylesWithColors.segment, tab === 'settings' && stylesWithColors.segmentActive]}
            testID="settings-tab"
          >
            <Ionicons name="options-outline" size={17} color={tab === 'settings' ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[stylesWithColors.segmentText, tab === 'settings' && stylesWithColors.segmentTextActive]}>الإعدادات</Text>
          </Pressable>
        </View>

        {tab === 'home' ? (
          <>
            <View style={stylesWithColors.hero}>
              <View style={stylesWithColors.heroGlow} />
              <View style={stylesWithColors.heroTopline}>
                <View style={stylesWithColors.statusPill}>
                  <View style={[stylesWithColors.statusDot, { backgroundColor: bubbleEnabled ? colors.success : colors.mutedForeground }]} />
                  <Text style={stylesWithColors.statusText}>{bubbleEnabled ? 'نشطة الآن' : 'متوقفة'}</Text>
                </View>
                <MaterialCommunityIcons name="orbit" size={27} color={colors.primary} />
              </View>
              <Text style={stylesWithColors.heroTitle}>كل تطبيقاتك،{'\n'}بنقرة واحدة.</Text>
              <Text style={stylesWithColors.heroBody}>
                افتح تطبيقاتك المفضلة بسرعة من مركز KH، بدون مغادرة ما تفعله.
              </Text>
              <Pressable
                onPress={() => setBubble(!bubbleEnabled)}
                style={({ pressed }) => [stylesWithColors.primaryButton, pressed && stylesWithColors.pressed]}
                testID="toggle-bubble"
              >
                <Ionicons name={bubbleEnabled ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={colors.primaryForeground} />
                <Text style={stylesWithColors.primaryButtonText}>{bubbleEnabled ? 'إيقاف الفقّاعة' : 'تشغيل الفقّاعة'}</Text>
              </Pressable>
            </View>

            <View style={stylesWithColors.sectionHeading}>
              <Text style={stylesWithColors.sectionTitle}>معاينة الفقّاعة</Text>
              <Pressable onPress={() => setTab('settings')} hitSlop={10}>
                <Text style={stylesWithColors.link}>تخصيص</Text>
              </Pressable>
            </View>
            <BubblePreview enabled={bubbleEnabled} size={bubbleSize} onPress={() => setTab('settings')} colors={colors} />

            <View style={stylesWithColors.sectionHeading}>
              <View>
                <Text style={stylesWithColors.sectionTitle}>اختصاراتك</Text>
                <Text style={stylesWithColors.sectionSubtitle}>{enabledShortcuts.length} تطبيقات ظاهرة في المركز</Text>
              </View>
              <MaterialCommunityIcons name="gesture-tap" size={21} color={colors.primary} />
            </View>
            <View style={stylesWithColors.shortcutGrid}>
              {shortcuts.map((shortcut) => (
                <Pressable
                  key={shortcut.id}
                  onPress={() => (shortcut.enabled ? void openShortcut(shortcut) : toggleShortcut(shortcut.id))}
                  onLongPress={() => toggleShortcut(shortcut.id)}
                  style={({ pressed }) => [
                    stylesWithColors.shortcutCard,
                    !shortcut.enabled && stylesWithColors.shortcutDisabled,
                    pressed && stylesWithColors.pressed,
                  ]}
                  testID={`shortcut-${shortcut.id}`}
                >
                  <View style={[stylesWithColors.appIcon, { backgroundColor: shortcut.enabled ? shortcut.color : colors.muted }]}>
                    <Ionicons name={shortcut.icon} size={24} color={shortcut.enabled ? '#FFFFFF' : colors.mutedForeground} />
                  </View>
                  <Text style={stylesWithColors.shortcutName}>{shortcut.label}</Text>
                  <Text style={stylesWithColors.shortcutAction}>{shortcut.enabled ? 'فتح' : 'مخفي'}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={stylesWithColors.helperText}>اضغط مطولًا على أي اختصار لإظهاره أو إخفائه.</Text>

            <View style={stylesWithColors.tipCard}>
              <View style={stylesWithColors.tipIcon}>
                <Ionicons name="shield-checkmark-outline" size={21} color={colors.primary} />
              </View>
              <View style={stylesWithColors.tipCopy}>
                <Text style={stylesWithColors.tipTitle}>مصمم للسرعة والخصوصية</Text>
                <Text style={stylesWithColors.tipBody}>تفضيلاتك تبقى على هاتفك. لا نحتاج إلى حساب أو تسجيل دخول.</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={stylesWithColors.settingsIntro}>
              <Text style={stylesWithColors.settingsTitle}>اجعلها كما تريد</Text>
              <Text style={stylesWithColors.settingsBody}>تحكم في ظهور الفقّاعة وحجمها واختصاراتك من مكان واحد.</Text>
            </View>

            <View style={stylesWithColors.settingsCard}>
              <View style={stylesWithColors.settingRow}>
                <View style={stylesWithColors.settingIcon}>
                  <Ionicons name="radio-outline" size={20} color={colors.primary} />
                </View>
                <View style={stylesWithColors.settingCopy}>
                  <Text style={stylesWithColors.settingTitle}>الفقّاعة العائمة</Text>
                  <Text style={stylesWithColors.settingDescription}>تظهر فوق التطبيقات الأخرى عند تفعيلها</Text>
                </View>
                <Switch
                  value={bubbleEnabled}
                  onValueChange={setBubble}
                  trackColor={{ false: colors.muted, true: colors.accent }}
                  thumbColor={bubbleEnabled ? colors.primary : colors.mutedForeground}
                  testID="bubble-switch"
                />
              </View>
              <View style={stylesWithColors.divider} />
              <View style={stylesWithColors.settingRow}>
                <View style={stylesWithColors.settingIcon}>
                  <Ionicons name="resize-outline" size={20} color={colors.primary} />
                </View>
                <View style={stylesWithColors.settingCopy}>
                  <Text style={stylesWithColors.settingTitle}>حجم الفقّاعة</Text>
                  <Text style={stylesWithColors.settingDescription}>اختر الحجم الأنسب لشاشتك</Text>
                </View>
              </View>
              <View style={stylesWithColors.sizeRow}>
                {sizes.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setSize(item.id)}
                    style={[stylesWithColors.sizeChoice, bubbleSize === item.id && stylesWithColors.sizeChoiceActive]}
                  >
                    <Text style={[stylesWithColors.sizeValue, bubbleSize === item.id && stylesWithColors.sizeValueActive]}>{item.value}</Text>
                    <Text style={[stylesWithColors.sizeLabel, bubbleSize === item.id && stylesWithColors.sizeLabelActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={stylesWithColors.settingsCard}>
              <Text style={stylesWithColors.cardHeading}>اختصارات المركز</Text>
              <Text style={stylesWithColors.cardSubheading}>التطبيقات المفعلة تظهر داخل الفقّاعة.</Text>
              {shortcuts.map((shortcut, index) => (
                <React.Fragment key={shortcut.id}>
                  <View style={stylesWithColors.settingRow}>
                    <View style={[stylesWithColors.appIconSmall, { backgroundColor: shortcut.color }]}>
                      <Ionicons name={shortcut.icon} size={18} color="#FFFFFF" />
                    </View>
                    <View style={stylesWithColors.settingCopy}>
                      <Text style={stylesWithColors.settingTitle}>{shortcut.label}</Text>
                      <Text style={stylesWithColors.settingDescription}>{shortcut.name}</Text>
                    </View>
                    <Switch
                      value={shortcut.enabled}
                      onValueChange={() => toggleShortcut(shortcut.id)}
                      trackColor={{ false: colors.muted, true: colors.accent }}
                      thumbColor={shortcut.enabled ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  {index < shortcuts.length - 1 && <View style={stylesWithColors.divider} />}
                </React.Fragment>
              ))}
            </View>

            <View style={stylesWithColors.settingsCard}>
              <View style={stylesWithColors.settingRow}>
                <View style={stylesWithColors.settingIcon}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
                </View>
                <View style={stylesWithColors.settingCopy}>
                  <Text style={stylesWithColors.settingTitle}>حركة هادئة</Text>
                  <Text style={stylesWithColors.settingDescription}>قلّل الحركات البصرية داخل التطبيق</Text>
                </View>
                <Switch
                  value={reduceMotion}
                  onValueChange={setReduceMotion}
                  trackColor={{ false: colors.muted, true: colors.accent }}
                  thumbColor={reduceMotion ? colors.primary : colors.mutedForeground}
                />
              </View>
              <Pressable onPress={resetPreferences} style={({ pressed }) => [stylesWithColors.resetButton, pressed && stylesWithColors.pressed]}>
                <Ionicons name="refresh-outline" size={18} color={colors.destructive} />
                <Text style={stylesWithColors.resetText}>إعادة كل الإعدادات</Text>
              </Pressable>
            </View>

            <View style={stylesWithColors.aboutRow}>
              <Text style={stylesWithColors.aboutText}>KH Floating Hub</Text>
              <Text style={stylesWithColors.aboutVersion}>الإصدار 1.0.0 · صنع من قبل Khalid ouassi</Text>
            </View>
          </>
        )}
      </ScrollView>

      {introVisible && (
        <View style={stylesWithColors.modalBackdrop}>
          <View style={[stylesWithColors.welcomeCard, { paddingBottom: insets.bottom + 22 }]}>
            <View style={stylesWithColors.welcomeMark}>
              <Text style={stylesWithColors.welcomeLetters}>KH</Text>
            </View>
            <Text style={stylesWithColors.welcomeKicker}>صنع من قبل Khalid ouassi</Text>
            <Text style={stylesWithColors.welcomeTitle}>أهلًا بك في مركزك السريع</Text>
            <Text style={stylesWithColors.welcomeBody}>
              KH Floating Hub يمنحك فقّاعة عائمة واختصارات سريعة للوصول إلى تطبيقاتك المفضلة من أي مكان.
            </Text>
            <View style={stylesWithColors.welcomePoints}>
              <View style={stylesWithColors.welcomePoint}>
                <Ionicons name="move-outline" size={18} color={colors.primary} />
                <Text style={stylesWithColors.welcomePointText}>اسحب الفقّاعة إلى أي مكان</Text>
              </View>
              <View style={stylesWithColors.welcomePoint}>
                <Ionicons name="resize-outline" size={18} color={colors.primary} />
                <Text style={stylesWithColors.welcomePointText}>تحكم في حجمها من الإعدادات</Text>
              </View>
              <View style={stylesWithColors.welcomePoint}>
                <Ionicons name="flash-outline" size={18} color={colors.primary} />
                <Text style={stylesWithColors.welcomePointText}>افتح التطبيقات بنقرة واحدة</Text>
              </View>
            </View>
            <Pressable onPress={closeIntro} style={({ pressed }) => [stylesWithColors.primaryButton, pressed && stylesWithColors.pressed]} testID="welcome-start">
              <Text style={stylesWithColors.primaryButtonText}>ابدأ الآن</Text>
              <Ionicons name="arrow-forward-outline" size={20} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, gap: 18 },
    header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 },
    eyebrow: { color: colors.primary, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 2, textAlign: 'right' },
    headerTitle: { color: colors.foreground, fontSize: 26, fontFamily: 'Inter_700Bold', marginTop: 6, textAlign: 'right' },
    logo: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7 },
    logoText: { color: colors.primaryForeground, fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
    segmented: { flexDirection: 'row-reverse', padding: 4, borderRadius: 15, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    segment: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, paddingVertical: 11 },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
    segmentTextActive: { color: colors.primaryForeground },
    hero: { overflow: 'hidden', borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 22, gap: 15 },
    heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -90, left: -35, backgroundColor: colors.secondary, opacity: 0.7 },
    heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, borderRadius: 30, backgroundColor: colors.muted, paddingHorizontal: 11, paddingVertical: 7 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11 },
    heroTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 37, textAlign: 'right' },
    heroBody: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, textAlign: 'right' },
    primaryButton: { backgroundColor: colors.primary, borderRadius: 15, paddingVertical: 15, paddingHorizontal: 17, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9 },
    primaryButtonText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 14 },
    pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
    sectionHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
    sectionTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'right' },
    sectionSubtitle: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'right' },
    link: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    bubbleStage: { height: 173, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    stageHint: { position: 'absolute', top: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
    stageHintText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
    bubble: { alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
    bubbleLetters: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -1 },
    bubbleDot: { width: 7, height: 7, borderRadius: 4, position: 'absolute', right: 8, top: 8, borderWidth: 1, borderColor: colors.primaryForeground },
    previewCaption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 12 },
    shortcutGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
    shortcutCard: { width: '48.2%', minHeight: 115, padding: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-end', gap: 6 },
    shortcutDisabled: { opacity: 0.55 },
    appIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
    appIconSmall: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    shortcutName: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
    shortcutAction: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
    helperText: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'right', marginTop: -6 },
    tipCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 15, borderRadius: 19, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
    tipIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    tipCopy: { flex: 1, alignItems: 'flex-end' },
    tipTitle: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'right' },
    tipBody: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 16, textAlign: 'right', marginTop: 3 },
    settingsIntro: { paddingVertical: 5, alignItems: 'flex-end' },
    settingsTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 25, textAlign: 'right' },
    settingsBody: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'right' },
    settingsCard: { backgroundColor: colors.card, borderRadius: 23, borderWidth: 1, borderColor: colors.border, padding: 16 },
    settingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, minHeight: 50 },
    settingIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
    settingCopy: { flex: 1, alignItems: 'flex-end' },
    settingTitle: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'right' },
    settingDescription: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, textAlign: 'right' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    sizeRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 14 },
    sizeChoice: { flex: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 11, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
    sizeChoiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sizeValue: { color: colors.mutedForeground, fontFamily: 'Inter_700Bold', fontSize: 15 },
    sizeValueActive: { color: colors.primaryForeground },
    sizeLabel: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
    sizeLabelActive: { color: colors.primaryForeground },
    cardHeading: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'right' },
    cardSubheading: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'right', marginTop: 5, marginBottom: 10 },
    resetButton: { marginTop: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
    resetText: { color: colors.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    aboutRow: { alignItems: 'center', paddingVertical: 4, gap: 5 },
    aboutText: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    aboutVersion: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center' },
    modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 4, 3, 0.82)', justifyContent: 'flex-end' },
    welcomeCard: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 24, paddingTop: 28, alignItems: 'center', gap: 14 },
    welcomeMark: { width: 68, height: 68, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    welcomeLetters: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -1 },
    welcomeKicker: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    welcomeTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 24, textAlign: 'center', marginTop: 2 },
    welcomeBody: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 320 },
    welcomePoints: { width: '100%', gap: 11, paddingVertical: 5 },
    welcomePoint: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
    welcomePointText: { color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'right' },
  });
}

const bubbleStyles = StyleSheet.create({
  bubbleStage: { height: 173, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stageHint: { position: 'absolute', top: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  stageHintText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  bubble: { alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
  bubbleLetters: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -1 },
  bubbleDot: { width: 7, height: 7, borderRadius: 4, position: 'absolute', right: 8, top: 8, borderWidth: 1 },
  previewCaption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 12 },
});