import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AppShortcut, useFloat } from '@/context/FloatContext';

export default function AppsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { apps, floatingItems, toggleFloatingApp } = useFloat();
  const [search, setSearch] = useState('');
  const visibleApps = useMemo(() => apps.filter((app) => `${app.name} ${app.subtitle}`.toLowerCase().includes(search.toLowerCase())), [apps, search]);
  const open = (app: AppShortcut) => Linking.openURL(app.url).catch(() => Alert.alert('تعذر الفتح', `لم يتم العثور على ${app.name} على هذا الجهاز.`));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}><View><Text style={[styles.brand, { color: colors.primary }]}>KH / LIBRARY</Text><Text style={[styles.title, { color: colors.foreground }]}>مكتبة التطبيقات</Text></View><View style={[styles.total, { backgroundColor: colors.accent }]}><Text style={[styles.totalText, { color: colors.primary }]}>{floatingItems.length} مثبتة</Text></View></View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>اختر ما يبقى قريبًا منك. اللمسة تفتح التطبيق، والعلامة تثبته في مساحتك.</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={17} color={colors.mutedForeground} /><TextInput testID="app-search" value={search} onChangeText={setSearch} placeholder="ابحث عن تطبيق" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} textAlign="right" />{search ? <Pressable onPress={() => setSearch('')}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}</View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>كل التطبيقات</Text>
        <View style={styles.list}>{visibleApps.map((app) => {
          const pinned = floatingItems.some((item) => item.appId === app.id);
          return <View key={app.id} style={[styles.appRow, { backgroundColor: colors.card, borderColor: pinned ? colors.primary : colors.border }]}>
            <View style={[styles.appIcon, { backgroundColor: app.color }]}><Feather name={app.icon as keyof typeof Feather.glyphMap} size={20} color="#FFF9EF" /></View>
            <View style={styles.appCopy}><Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text><Text style={[styles.appSub, { color: colors.mutedForeground }]}>{app.subtitle}</Text></View>
            <Pressable testID={`launch-${app.id}`} onPress={() => open(app)} style={[styles.rowAction, { backgroundColor: colors.secondary }]}><Feather name="external-link" size={15} color={colors.secondaryForeground} /></Pressable>
            <Pressable testID={`pin-${app.id}`} onPress={() => { toggleFloatingApp(app.id); void Haptics.selectionAsync(); }} style={[styles.pinAction, { backgroundColor: pinned ? colors.primary : colors.accent }]}><Feather name={pinned ? 'check' : 'plus'} size={17} color={pinned ? colors.primaryForeground : colors.primary} /></Pressable>
          </View>;
        })}</View>
        {!visibleApps.length ? <View style={styles.empty}><Feather name="search" size={23} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد نتائج</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>جرّب كلمة بحث مختلفة</Text></View> : null}
        <View style={[styles.info, { backgroundColor: colors.accent }]}><Feather name="move" size={17} color={colors.primary} /><Text style={[styles.infoText, { color: colors.secondaryForeground }]}>بعد تثبيت التطبيق، اذهب للرئيسية واسحب فقاعة التطبيق إلى المكان الذي يناسبك.</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  brand: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 5 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  total: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  totalText: { fontSize: 11, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 21, marginTop: 9, marginBottom: 19 },
  searchBox: { height: 48, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '900', marginTop: 25, marginBottom: 10, textAlign: 'right' },
  list: { gap: 10 },
  appRow: { minHeight: 75, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  appIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appCopy: { flex: 1 },
  appName: { fontSize: 14, fontWeight: '900', marginBottom: 4, textAlign: 'right' },
  appSub: { fontSize: 11, textAlign: 'right' },
  rowAction: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinAction: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 17, marginTop: 20 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 18 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 55, gap: 7 },
  emptyTitle: { fontSize: 15, fontWeight: '900', marginTop: 4 },
  emptyText: { fontSize: 12 },
});