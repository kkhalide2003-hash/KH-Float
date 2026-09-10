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

  const open = (app: AppShortcut) => {
    Linking.openURL(app.url).catch(() => Alert.alert('تعذر الفتح', `لم يتم العثور على ${app.name} على هذا الجهاز.`));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 14 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>مكتبتك  /  05 تطبيقات</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>التطبيقات</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>اختر ما تريد أن يبقى قريبًا منك في مساحة KH.</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            testID="app-search"
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث عن تطبيق..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            textAlign="right"
          />
          {search ? <Pressable onPress={() => setSearch('')}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
        </View>
        <View style={styles.list}>
          {visibleApps.map((app) => {
            const pinned = floatingItems.some((item) => item.appId === app.id);
            return (
              <View key={app.id} style={[styles.appRow, { backgroundColor: colors.card, borderColor: pinned ? colors.primary : colors.border }]}>
                <View style={[styles.appIcon, { backgroundColor: app.color }]}><Feather name={app.icon as keyof typeof Feather.glyphMap} size={21} color="#FFF9EF" /></View>
                <View style={styles.appCopy}>
                  <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
                  <Text style={[styles.appSub, { color: colors.mutedForeground }]}>{app.subtitle}</Text>
                </View>
                <Pressable testID={`launch-${app.id}`} onPress={() => open(app)} style={[styles.launchButton, { backgroundColor: colors.secondary }]}>
                  <Feather name="external-link" size={16} color={colors.secondaryForeground} />
                </Pressable>
                <Pressable
                  testID={`pin-${app.id}`}
                  onPress={() => { toggleFloatingApp(app.id); if (Haptics.selectionAsync) void Haptics.selectionAsync(); }}
                  style={[styles.pinButton, { backgroundColor: pinned ? colors.primary : colors.accent }]}
                >
                  <Feather name={pinned ? 'check' : 'plus'} size={18} color={pinned ? colors.primaryForeground : colors.primary} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={[styles.info, { backgroundColor: colors.accent }]}>
          <Feather name="info" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>يمكنك فتح التطبيق فورًا من هنا، أو تثبيته كفقاعة في الصفحة الرئيسية. السحب يتم من داخل مساحة النوافذ.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 20 },
  searchBox: { height: 48, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  list: { gap: 10, marginTop: 18 },
  appRow: { minHeight: 75, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  appIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appCopy: { flex: 1 },
  appName: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  appSub: { fontSize: 12 },
  launchButton: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinButton: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15, borderRadius: 17, marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 19 },
});