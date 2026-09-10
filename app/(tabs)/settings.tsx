import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFloat } from '@/context/FloatContext';

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={17} color={colors.primary} /></View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={value ? colors.primaryForeground : colors.mutedForeground} />
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, setSetting, resetWorkspace } = useFloat();

  const openOverlaySettings = () => {
    if (typeof Linking.openSettings === 'function') {
      void Linking.openSettings();
    } else {
      Alert.alert('إعدادات الجهاز', 'افتح إعدادات التطبيقات ثم اسمح لـ KH Float بالظهور فوق التطبيقات.');
    }
  };

  const reset = () => {
    Alert.alert('إعادة ضبط المساحة', 'سيتم إعادة الفقاعات والإعدادات إلى الوضع الافتراضي.', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إعادة الضبط', style: 'destructive', onPress: resetWorkspace },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 14 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>التخصيص  /  KH FLOAT</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>الإعدادات</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>تحكم في طريقة ظهور الفقاعة وسلوك التطبيق.</Text>

        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>الوصول العائم</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="layers" title="الظهور فوق التطبيقات" subtitle="أبقى فقاعة KH قريبة منك أثناء استخدام هاتفك" value={settings.overlayEnabled} onChange={(value) => setSetting('overlayEnabled', value)} />
          <SettingRow icon="zap" title="الفتح السريع" subtitle="افتح التطبيق بلمسة واحدة من الفقاعة" value={settings.autoLaunch} onChange={(value) => setSetting('autoLaunch', value)} />
        </View>
        <Pressable testID="overlay-permission" onPress={openOverlaySettings} style={({ pressed }) => [styles.permissionButton, { borderColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <View style={styles.permissionCopy}>
            <Text style={[styles.permissionTitle, { color: colors.primary }]}>فتح إعداد صلاحية الظهور</Text>
            <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>مطلوب على أندرويد لتثبيت الفقاعة خارج التطبيق</Text>
          </View>
          <Feather name="chevron-left" size={17} color={colors.primary} />
        </Pressable>

        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>المظهر والسلوك</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="minimize-2" title="الوضع المصغّر" subtitle="فقاعات أصغر ومساحة أكثر هدوءًا" value={settings.compactMode} onChange={(value) => setSetting('compactMode', value)} />
          <SettingRow icon="volume-2" title="الاهتزاز اللمسي" subtitle="إحساس خفيف عند التثبيت أو التغيير" value={settings.haptics} onChange={(value) => setSetting('haptics', value)} />
        </View>

        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>المساحة</Text>
        <Pressable onPress={reset} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}><Feather name="refresh-cw" size={17} color={colors.primary} /></View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>إعادة ضبط المساحة</Text><Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>إرجاع الفقاعات إلى أماكنها الأصلية</Text></View>
          <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={[styles.about, { borderTopColor: colors.border }]}>
          <View style={[styles.smallLogo, { backgroundColor: colors.primary }]}><Text style={[styles.smallLogoText, { color: colors.primaryForeground }]}>KH</Text></View>
          <View><Text style={[styles.aboutTitle, { color: colors.foreground }]}>KH Float</Text><Text style={[styles.aboutText, { color: colors.mutedForeground }]}>صنع من قبل Khalid Ouassi  •  النسخة 1.0</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 38 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 25 },
  groupTitle: { fontSize: 12, fontWeight: '800', marginBottom: 9, textAlign: 'right' },
  group: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  settingRow: { minHeight: 75, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, gap: 11 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4, textAlign: 'right' },
  settingSubtitle: { fontSize: 11, lineHeight: 17, textAlign: 'right' },
  permissionButton: { minHeight: 70, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 26 },
  permissionCopy: { flex: 1 },
  permissionTitle: { fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  permissionText: { fontSize: 11, textAlign: 'right' },
  actionRow: { minHeight: 70, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  about: { borderTopWidth: 1, marginTop: 28, paddingTop: 22, flexDirection: 'row', alignItems: 'center', gap: 11 },
  smallLogo: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  smallLogoText: { fontSize: 14, fontWeight: '900' },
  aboutTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  aboutText: { fontSize: 11 },
});