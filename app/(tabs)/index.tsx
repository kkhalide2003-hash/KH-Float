import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { AppShortcut, FloatingItem, useFloat } from '@/context/FloatContext';

function launchShortcut(app: AppShortcut) {
  Linking.openURL(app.url).catch(() => {
    Alert.alert('تعذر الفتح', `لم يتم العثور على ${app.name} أو أن هذا الرابط غير مدعوم على جهازك.`);
  });
}

function Intro({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.intro, { backgroundColor: colors.background }]}>
      <View style={[styles.introGlow, { backgroundColor: colors.accent }]} />
      <View style={[styles.logoLarge, { borderColor: colors.primary, backgroundColor: colors.card }]}>
        <Text style={[styles.logoLetters, { color: colors.primary }]}>KH</Text>
      </View>
      <Text style={[styles.introKicker, { color: colors.primary }]}>صنع من قبل Khalid Ouassi</Text>
      <Text style={[styles.introTitle, { color: colors.foreground }]}>كل تطبيقاتك،{'\n'}في متناول يدك.</Text>
      <Text style={[styles.introBody, { color: colors.mutedForeground }]}>
        فقاعة واحدة تظل قريبة منك للوصول السريع. رتّب تطبيقاتك، حرّكها، وكبّرها أو أزلها كما تريد.
      </Text>
      <Pressable
        accessibilityRole="button"
        testID="intro-continue"
        onPress={onContinue}
        style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
      >
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>ابدأ مع KH Float</Text>
        <Feather name="arrow-left" size={18} color={colors.primaryForeground} />
      </Pressable>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>نسخة 1.0  •  وصول أسرع، تحكم أكثر</Text>
    </View>
  );
}

function FloatingCard({
  item,
  app,
  onLaunch,
  onRemove,
  onUpdate,
}: {
  item: FloatingItem;
  app: AppShortcut;
  onLaunch: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<FloatingItem>) => void;
}) {
  const colors = useColors();
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const start = useRef({ x: item.x, y: item.y });
  const sizeOptions = [72, 84, 100];
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = position; },
    onPanResponderMove: (_, gesture) => {
      setPosition({
        x: Math.max(4, Math.min(274, start.current.x + gesture.dx)),
        y: Math.max(12, Math.min(156, start.current.y + gesture.dy)),
      });
    },
    onPanResponderRelease: () => onUpdate({ x: position.x, y: position.y }),
  }), [position, onUpdate]);

  const cycleSize = () => {
    const next = sizeOptions[(sizeOptions.indexOf(item.size) + 1) % sizeOptions.length];
    onUpdate({ size: next });
    if (Haptics.impactAsync) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.floatingCard,
        { left: position.x, top: position.y, width: item.size, height: item.size, backgroundColor: app.color },
      ]}
    >
      <Pressable onPress={onLaunch} style={styles.floatingPress}>
        <Feather name={app.icon as keyof typeof Feather.glyphMap} size={item.size > 80 ? 26 : 22} color="#FFF9EF" />
        <Text numberOfLines={1} style={styles.floatingLabel}>{app.name}</Text>
      </Pressable>
      <Pressable testID={`resize-${app.id}`} onPress={cycleSize} style={styles.floatAction}>
        <Feather name="maximize-2" size={12} color="#FFF9EF" />
      </Pressable>
      <Pressable testID={`remove-${app.id}`} onPress={onRemove} style={[styles.floatAction, styles.removeAction]}>
        <Feather name="x" size={12} color="#FFF9EF" />
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { apps, floatingItems, introSeen, hydrated, dismissIntro, clearWorkspace, removeFloatingApp, updateFloatingItem } = useFloat();
  const [notice, setNotice] = useState('');
  const favoriteApps = apps.filter((app) => floatingItems.some((item) => item.appId === app.id));

  if (!hydrated) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.mutedForeground }}>جارٍ تجهيز مساحتك…</Text></View>;
  if (!introSeen) return <Intro onContinue={dismissIntro} />;

  const showNotice = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 1800);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>KH FLOAT  /  مساحتك</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>مرحبًا بك</Text>
          </View>
          <Pressable testID="open-settings" onPress={() => router.push('/settings')} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="sliders" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={[styles.statusBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>مساحتك جاهزة</Text>
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>اضغط مطولًا على أي فقاعة لتحريكها</Text>
          </View>
          <Text style={[styles.statusCount, { color: colors.primary }]}>{floatingItems.length}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الوصول السريع</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {favoriteApps.map((app) => (
            <Pressable key={app.id} onPress={() => launchShortcut(app)} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.quickIcon, { backgroundColor: app.color }]}><Feather name={app.icon as keyof typeof Feather.glyphMap} size={19} color="#FFF9EF" /></View>
              <Text style={[styles.quickName, { color: colors.foreground }]}>{app.name}</Text>
              <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>{app.subtitle}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => router.push('/apps')} style={[styles.addQuick, { borderColor: colors.primary }]}>
            <Feather name="plus" size={22} color={colors.primary} />
            <Text style={[styles.addQuickText, { color: colors.primary }]}>إضافة</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.workspaceHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 3 }]}>مساحة النوافذ</Text>
            <Text style={[styles.caption, { color: colors.mutedForeground }]}>حرّك، كبّر، أو أزل أي فقاعة</Text>
          </View>
          <Pressable onPress={() => showNotice('يمكن تعديل الفقاعات من صفحة التطبيقات')}><Text style={[styles.link, { color: colors.primary }]}>كيف تعمل؟</Text></Pressable>
        </View>
        <View style={[styles.workspace, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.workspaceGrid, { borderColor: colors.border }]} />
          {floatingItems.map((item) => {
            const app = apps.find((candidate) => candidate.id === item.appId);
            if (!app) return null;
            return <FloatingCard key={item.id} item={item} app={app} onLaunch={() => launchShortcut(app)} onRemove={() => { removeFloatingApp(item.id); showNotice('تمت إزالة الفقاعة'); }} onUpdate={(patch) => updateFloatingItem(item.id, patch)} />;
          })}
          {floatingItems.length === 0 && (
            <View style={styles.emptyWorkspace}>
              <Feather name="layers" size={26} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>مساحتك فارغة</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>أضف تطبيقات لتظهر هنا كفقاعات</Text>
              <Pressable onPress={() => router.push('/apps')}><Text style={[styles.link, { color: colors.primary }]}>اختيار التطبيقات</Text></Pressable>
            </View>
          )}
        </View>
        <View style={styles.actionRow}>
          <Pressable
            testID="add-bubble"
            onPress={() => router.push('/apps')}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>إضافة فقاعة</Text>
          </Pressable>
          <Pressable
            testID="clear-bubbles"
            onPress={() => {
              if (!floatingItems.length) return;
              Alert.alert('إزالة جميع الفقاعات', 'هل تريد تفريغ مساحة النوافذ بالكامل؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'إزالة الكل', style: 'destructive', onPress: () => { clearWorkspace(); showNotice('تمت إزالة جميع الفقاعات'); } },
              ]);
            }}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1, opacity: pressed ? 0.78 : 1 }]}
          >
            <Feather name="trash-2" size={16} color={colors.secondaryForeground} />
            <Text style={[styles.actionButtonText, { color: colors.secondaryForeground }]}>إزالة الكل</Text>
          </Pressable>
        </View>

        <View style={[styles.tip, { backgroundColor: colors.accent }]}>
          <Feather name="zap" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.secondaryForeground }]}>فعّل الظهور فوق التطبيقات من الإعدادات لتظل الفقاعة قريبة أثناء استخدام هاتفك.</Text>
        </View>
      </ScrollView>
      {notice ? <View style={[styles.toast, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>{notice}</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, overflow: 'hidden' },
  introGlow: { position: 'absolute', width: 310, height: 310, borderRadius: 200, opacity: 0.45, top: '16%' },
  logoLarge: { width: 112, height: 112, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  logoLetters: { fontSize: 34, fontWeight: '800', letterSpacing: -2 },
  introKicker: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, marginBottom: 16 },
  introTitle: { fontSize: 34, fontWeight: '800', textAlign: 'center', lineHeight: 42, letterSpacing: -1 },
  introBody: { fontSize: 15, lineHeight: 25, textAlign: 'center', marginTop: 18, maxWidth: 320 },
  primaryButton: { height: 55, borderRadius: 17, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 34 },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  version: { position: 'absolute', bottom: 28, fontSize: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  iconButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 27 },
  statusDot: { width: 9, height: 9, borderRadius: 9, marginRight: 12 },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  statusText: { fontSize: 12 },
  statusCount: { fontSize: 26, fontWeight: '800' },
  sectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  quickRow: { gap: 10, paddingVertical: 14, paddingRight: 4 },
  quickCard: { width: 112, borderWidth: 1, borderRadius: 17, padding: 12 },
  quickIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickName: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  quickSub: { fontSize: 11 },
  addQuick: { width: 92, borderRadius: 17, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 5 },
  addQuickText: { fontSize: 12, fontWeight: '800' },
  workspaceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  caption: { fontSize: 12 },
  link: { fontSize: 12, fontWeight: '800' },
  workspace: { height: 238, borderWidth: 1, borderRadius: 22, overflow: 'hidden', marginTop: 12, position: 'relative' },
  workspaceGrid: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.35, borderWidth: 1, borderStyle: 'dashed' },
  floatingCard: { position: 'absolute', borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  floatingPress: { alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' },
  floatingLabel: { color: '#FFF9EF', fontSize: 10, fontWeight: '800', marginTop: 5, maxWidth: '85%' },
  floatAction: { position: 'absolute', top: 5, right: 5, width: 19, height: 19, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.26)', alignItems: 'center', justifyContent: 'center' },
  removeAction: { top: 5, right: 28 },
  emptyWorkspace: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  emptyTitle: { fontWeight: '800', fontSize: 15, marginTop: 4 },
  emptyText: { fontSize: 12 },
  tip: { borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 19 },
  toast: { position: 'absolute', bottom: 92, alignSelf: 'center', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1, minHeight: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  actionButtonText: { fontSize: 12, fontWeight: '800' },
});