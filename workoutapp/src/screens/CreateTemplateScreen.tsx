import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { WorkoutStep } from '../types/workout';
import { getAuthToken } from '../api/auth';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, any>;

const stepKinds = ['exercise', 'stretch', 'rest'] as const;

export default function CreateTemplateScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<WorkoutStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStep = () => {
    setSteps([
      ...steps,
  { name: '', kind: 'exercise', durationSec: 30, reps: 1, restDurationSec: 10, notes: '' },
    ]);
  };

  const updateStep = (idx: number, field: keyof WorkoutStep, value: any) => {
    setSteps(steps => steps.map((step, i) => i === idx ? { ...step, [field]: value } : step));
  };

  const removeStep = (idx: number) => {
    setSteps(steps => steps.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!name.trim()) {
        throw new Error('Template name is required');
      }
      if (steps.length === 0) {
        throw new Error('Template must have at least one step');
      }
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, steps, isPublic: false }), // userId will be set by backend from token
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || `Failed to create template: ${res.status}`);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Template</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.input}
          placeholder="Template Name"
          value={name}
          onChangeText={setName}
        />
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepContainer}>
            <TextInput
              style={styles.input}
              placeholder="Step Name"
              value={step.name}
              onChangeText={v => updateStep(idx, 'name', v)}
            />
            <View style={styles.row}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {stepKinds.map(kind => (
                  <TouchableOpacity
                    key={kind}
                    style={[styles.kindButton, step.kind === kind && styles.kindButtonSelected]}
                    onPress={() => updateStep(idx, 'kind', kind)}
                  >
                    <Text style={step.kind === kind ? styles.kindTextSelected : styles.kindText}>{kind}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.fieldLabel}>Duration (seconds)</Text>
            <TextInput
              style={styles.input}
              placeholder="Duration (sec)"
              keyboardType="numeric"
              value={step.durationSec?.toString() || ''}
              onChangeText={v => updateStep(idx, 'durationSec', Number(v))}
            />
            <Text style={styles.fieldLabel}>Repetitions</Text>
            <TextInput
              style={styles.input}
              placeholder="Reps"
              keyboardType="numeric"
              value={step.reps?.toString() || ''}
              onChangeText={v => updateStep(idx, 'reps', Number(v))}
            />
            <Text style={styles.fieldLabel}>Rest Duration (seconds)</Text>
            <TextInput
              style={styles.input}
              placeholder="Rest Duration (sec)"
              keyboardType="numeric"
              value={step.restDurationSec?.toString() || ''}
              onChangeText={v => updateStep(idx, 'restDurationSec', Number(v))}
            />
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={step.notes || ''}
              onChangeText={v => updateStep(idx, 'notes', v)}
            />
            <TouchableOpacity style={styles.removeButton} onPress={() => removeStep(idx)}>
              <Text style={styles.removeButtonText}>Remove Step</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addStep}>
          <Text style={styles.addButtonText}>+ Add Step</Text>
        </TouchableOpacity>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Creating...' : 'Create Template'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    padding: 8,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  stepContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  fieldLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.input.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.input.border,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: colors.text.primary,
    marginRight: 8,
  },
  kindButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.background.primary,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.input.border,
  },
  kindButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  kindText: {
    color: colors.text.primary,
  },
  kindTextSelected: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: colors.button.disabled,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    color: colors.text.error,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  submitButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  buttonDisabled: {
    backgroundColor: colors.button.disabled,
  },
  errorContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.text.error,
  },
  error: {
    color: colors.text.error,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
