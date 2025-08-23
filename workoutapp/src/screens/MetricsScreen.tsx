import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, typography } from '../theme';
import WideButton from '../components/WideButton';
import NeoInput from '../components/NeoInput';
import { postProgress, type ProgressMetric } from '../api/progress';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

 type Props = NativeStackScreenProps<RootStackParamList, 'Metrics'>;

export default function MetricsScreen({ navigation }: Props) {
  const [weight, setWeight] = useState('');
  const [pullup, setPullup] = useState('');
  const [hang, setHang] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeNumber = (txt: string) => txt.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

  const handleLog = async () => {
    const entries: Array<{ metric: ProgressMetric; value: number }> = [];
    if (weight.trim() !== '') entries.push({ metric: 'weight', value: Number(weight) });
    if (pullup.trim() !== '') entries.push({ metric: 'pullup_1rm', value: Number(pullup) });
    if (hang.trim() !== '') entries.push({ metric: 'hang_20mm_7s', value: Number(hang) });

    if (entries.length === 0) {
      Alert.alert('Nothing to log', 'Enter at least one metric.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(entries.map(e => postProgress(e.metric, e.value)));
      Alert.alert('Logged', 'Your metrics were logged.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not log metrics.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Today's Metrics</Text>

        <View style={styles.block}>
          <Text style={styles.label}>Body weight (kg)</Text>
          <NeoInput
            value={weight}
            onChangeText={(t) => setWeight(sanitizeNumber(t))}
            placeholder="e.g., 72.5"
            keyboardType="numeric"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Max single pull-up (added, kg)</Text>
          <NeoInput
            value={pullup}
            onChangeText={(t) => setPullup(sanitizeNumber(t))}
            placeholder="e.g., 35"
            keyboardType="numeric"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Max 7s hang on 20mm edge (added, kg)</Text>
          <NeoInput
            value={hang}
            onChangeText={(t) => setHang(sanitizeNumber(t))}
            placeholder="e.g., 25"
            keyboardType="numeric"
            autoCapitalize="none"
          />
        </View>

        <WideButton
          title={isSubmitting ? 'Logging…' : 'Log'}
          onPress={handleLog}
          backgroundColor={isSubmitting ? colors.button.disabled : colors.button.dark}
        />

        <WideButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          backgroundColor={colors.button.tileDefault}
          textColor={colors.text.secondary}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 70,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: typography.fontSize.title_s,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 28,
  },
  block: {
    marginBottom: 16,
  },
  label: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 8,
  },
});
