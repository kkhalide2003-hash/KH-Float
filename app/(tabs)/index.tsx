import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AppShortcut, FloatingItem, useFloat } from '@/context/FloatContext';

function launchShortcut(app: AppShortcut) {
  Linking.openURL(app.url).catch(() => Alert.alert('تعذر الفتح', `لم يتم العثور على ${app.name} أو أن هذا الرابط غير مدعوم على جهازك.`));
}

function Intro({ onContinue }: { onContinue: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.intro, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#17130B', '#0B0B0A']} style={StyleSheet.absoluteFill} />
      <View style={[styles.introRing, { borderColor: colors.primary }]} />
      <View style={[styles.logoLarge, { backgroundColor: colors.primary }]}>
        <Text style={[styles.logoLetters, { color: colors.primaryForeground }]}>KH</Text>
      </View>
      <Text style={[styles.introKicker, { color: colors.primary }]}>صنع من قبل Khalid Ouassi</Text>
      <Text style={[styles.introTitle, { color: colors.foreground }]}>كل تطبيقاتك،{'\n'}في مكان واحد.</Text>
      <Text style={[styles.introBody, { color: colors.mutedForeground }]}>فقاعة واحدة للوصول السريع. رتّب مساحتك، افتح تطبيقاتك، وتحكم بكل شيء بلمسة.</Text>
      <Pressable testID="intro-continue" onPress={onContinue} style={({ pressed }) => [styles.introButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={[styles.introButtonText, { color: colors.primaryForeground }]}>ابدأ الآن</Text>
        <Feather name="arrow-left" size={18} color={colors.primaryForeground} />
      </Pressable>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>KH FLOAT  /  1.0</Text>
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
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const start = useRef({ x: item.x, y: item.y });
  const sizeOptions = [72, 84, 100];
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = position; },
    onPanResponderMove: (_, gesture) => {
      setPosition({
        x: Math.max(8, Math.min(270, start.current.x + gesture.dx)),
        y: Math.max(12, Math.min(178, start.current.y + gesture.dy)),
      });
    },
    onPanResponderRelease: () => onUpdate({ x: position.x, y: position.y }),
  }), [position, onUpdate]);

  const cycleSize = () => {
    const next = sizeOptions[(sizeOptions.indexOf(item.size) + 1) % sizeOptions.length];
    onUpdate({ size: next });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View {...panResponder.panHandlers} style={[styles.floatingCard, { left: position.x, top: position.y, width: item.size, height: item.size, backgroundColor: app.color }]}>
      <Pressable onPress={onLaunch} style={styles.floatingPress}>
        <Feather name={app.icon as keyof typeof Feather.glyphMap} size={item.size > 80 ? 24 : 20} color="#FFF9EF" />
        <Text numberOfLines={1} style={styles.floatingLabel}>{app.name}</Text>
      </Pressable>
      <Pressable testID={`resize-${app.id}`} onPress={cycleSize} style={[styles.floatAction, { right: 5 }]}><Feather name="maximize-2" size={11} color="#FFF9EF" /></Pressable>
      <Pressable testID={`remove-${app.id}`} onPress={onRemove} style={[styles.floatAction, { right: 28 }]}><Feather name="x" size={11} color="#FFF9EF" /></Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { apps, floatingItems, introSeen, hydrated, settings, dismissIntro, clearWorkspace, removeFloatingApp, updateFloatingItem } = useFloat();
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>KH / FLOAT</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>مركز الوصول</Text>
          </View>
          <Pressable testID="open-settings" onPress={() => router.push('/settings')} style={[styles.headerButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="settings" size={19} color={colors.primary} />
          </Pressable>
        </View>

        <LinearGradient colors={['#C69638', '#8B611E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>{settings.overlayEnabled ? 'العائم مفعل' : 'جاهز للتخصيص'}</Text></View>
            <Text style={styles.heroTitle}>مساحتك،{'\n'}بلمسة واحدة.</Text>
            <Text style={styles.heroSub}>اسحب الفقاعات ورتّبها كما يناسب يومك.</Text>
          </View>
          <View style={styles.heroOrb}><Text style={styles.heroOrbText}>KH</Text><View style={styles.orbShine} /></View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>الوصول السريع</Text><Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>تطبيقاتك المفضلة</Text></View>
          <Pressable onPress={() => router.push('/apps')}><Text style={[styles.seeAll, { color: colors.primary }]}>إدارة الكل</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {favoriteApps.slice(0, 4).map((app) => (
            <Pressable key={app.id} onPress={() => launchShortcut(app)} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
              <View style={[styles.quickIcon, { backgroundColor: app.color }]}><Feather name={app.icon as keyof typeof Feather.glyphMap} size={18} color="#FFF9EF" /></View>
              <Text style={[styles.quickName, { color: colors.foreground }]}>{app.name}</Text>
              <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>{app.subtitle}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => router.push('/apps')} style={[styles.addCard, { borderColor: colors.primary }]}>
            <Feather name="plus" size={20} color={colors.primary} /><Text style={[styles.addText, { color: colors.primary }]}>إضافة</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>المساحة النشطة</Text><Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>اسحب أي فقاعة لتغيير مكانها</Text></View>
          <View style={[styles.counter, { backgroundColor: colors.accent }]}><Text style={[styles.counterText, { color: colors.primary }]}>{floatingItems.length} نشطة</Text></View>
        </View>
        <View style={[styles.workspace, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.workspaceLine, { borderColor: colors.border }]} />
          <View style={[styles.workspaceCenter, { borderColor: colors.border }]}><Text style={[styles.workspaceLogo, { color: colors.primary }]}>KH</Text><Text style={[styles.workspaceHint, { color: colors.mutedForeground }]}>مساحتك العائمة</Text></View>
          {floatingItems.map((item) => {
            const app = apps.find((candidate) => candidate.id === item.appId);
            if (!app) return null;
            return <FloatingCard key={item.id} item={item} app={app} onLaunch={() => launchShortcut(app)} onRemove={() => { removeFloatingApp(item.id); showNotice('تم حذف الفقاعة'); }} onUpdate={(patch) => updateFloatingItem(item.id, patch)} />;
          })}
          {!floatingItems.length ? <View style={styles.emptyWorkspace}><Feather name="layers" size={26} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد فقاعات</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>أضف تطبيقًا لبدء مساحتك</Text></View> : null}
        </View>

        <View style={styles.actionRow}>
          <Pressable testID="add-bubble" onPress={() => router.push('/apps')} style={({ pressed }) => [styles.mainAction, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Feather name="plus" size={16} color={colors.primaryForeground} /><Text style={[styles.mainActionText, { color: colors.primaryForeground }]}>إضافة فقاعة</Text></Pressable>
          <Pressable testID="clear-bubbles" onPress={() => { if (!floatingItems.length) return; Alert.alert('إزالة جميع الفقاعات', 'هل تريد تفريغ المساحة بالكامل؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'إزالة الكل', style: 'destructive', onPress: () => { clearWorkspace(); showNotice('تم تفريغ المساحة'); } }]); }} style={({ pressed }) => [styles.secondaryAction, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}><Feather name="trash-2" size={16} color={colors.secondaryForeground} /><Text style={[styles.mainActionText, { color: colors.secondaryForeground }]}>إزالة الكل</Text></Pressable>
        </View>
        <View style={[styles.tip, { backgroundColor: colors.accent }]}><Feather name="info" size={17} color={colors.primary} /><Text style={[styles.tipText, { color: colors.secondaryForeground }]}>فعّل الظهور فوق التطبيقات من الإعدادات عندما تريد بقاء فقاعة KH قريبة منك.</Text></View>
      </ScrollView>
      {notice ? <View style={[styles.toast, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '800' }}>{notice}</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, overflow: 'hidden' },
  introRing: { position: 'absolute', width: 280, height: 280, borderRadius: 160, borderWidth: 1, opacity: 0.18 },
  logoLarge: { width: 112, height: 112, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 25, shadowColor: '#D6A84A', shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  logoLetters: { fontSize: 34, fontWeight: '900', letterSpacing: -2 },
  introKicker: { fontSize: 13, fontWeight: '800', marginBottom: 15 },
  introTitle: { fontSize: 34, fontWeight: '900', lineHeight: 42, letterSpacing: -1, textAlign: 'center' },
  introBody: { maxWidth: 320, fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 18 },
  introButton: { height: 54, paddingHorizontal: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 33 },
  introButtonText: { fontSize: 15, fontWeight: '900' },
  version: { position: 'absolute', bottom: 28, fontSize: 11, letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brand: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  headerButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 195, borderRadius: 24, padding: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { flex: 1 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 17 },
  liveDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: '#FFF9EF' },
  liveText: { color: '#FFF9EF', fontSize: 11, fontWeight: '800' },
  heroTitle: { color: '#FFF9EF', fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 },
  heroSub: { color: '#F4E4C5', fontSize: 12, lineHeight: 18, marginTop: 10, maxWidth: 170 },
  heroOrb: { width: 112, height: 112, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,249,239,0.55)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,15,4,0.18)' },
  heroOrbText: { color: '#FFF9EF', fontSize: 27, fontWeight: '900', letterSpacing: -2 },
  orbShine: { position: 'absolute', width: 14, height: 14, borderRadius: 10, backgroundColor: '#FFF9EF', opacity: 0.65, top: 17, right: 19 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  sectionSub: { fontSize: 11, marginTop: 4 },
  seeAll: { fontSize: 12, fontWeight: '900' },
  quickRow: { gap: 10, paddingVertical: 2 },
  quickCard: { width: 108, minHeight: 112, padding: 12, borderRadius: 18, borderWidth: 1 },
  quickIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickName: { fontSize: 13, fontWeight: '900', marginBottom: 4 },
  quickSub: { fontSize: 11 },
  addCard: { width: 92, minHeight: 112, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 7 },
  addText: { fontSize: 12, fontWeight: '900' },
  counter: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  counterText: { fontSize: 11, fontWeight: '900' },
  workspace: { height: 268, borderWidth: 1, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  workspaceLine: { position: 'absolute', left: 20, right: 20, top: 20, bottom: 20, borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, opacity: 0.45 },
  workspaceCenter: { position: 'absolute', left: '50%', top: '50%', marginLeft: -43, marginTop: -28, width: 86, alignItems: 'center', borderTopWidth: 1, paddingTop: 8 },
  workspaceLogo: { fontSize: 20, fontWeight: '900', letterSpacing: -1 },
  workspaceHint: { fontSize: 9, marginTop: 3 },
  floatingCard: { position: 'absolute', borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  floatingPress: { alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' },
  floatingLabel: { color: '#FFF9EF', fontSize: 10, fontWeight: '900', marginTop: 5, maxWidth: '86%' },
  floatAction: { position: 'absolute', top: 5, width: 19, height: 19, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  emptyWorkspace: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  emptyTitle: { fontSize: 15, fontWeight: '900', marginTop: 4 },
  emptyText: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  mainAction: { flex: 1, minHeight: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  secondaryAction: { flex: 1, minHeight: 46, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  mainActionText: { fontSize: 12, fontWeight: '900' },
  tip: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 16 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 18 },
  toast: { position: 'absolute', bottom: 90, alignSelf: 'center', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11 },
});