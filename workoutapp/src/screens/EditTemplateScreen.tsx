import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { WorkoutStep } from '../types/workout';
import { getAuthToken } from '../api/auth';
import { colors, typography } from '../theme';
import { fetchTemplateById, updateTemplate } from '../api/templates';

type Props = NativeStackScreenProps<RootStackParamList, 'EditTemplate'>;

const stepKinds = ['exercise', 'stretch', 'rest'] as const;

export default function EditTemplateScreen({ navigation, route }: Props) {
  const { templateId } = route.params;
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<WorkoutStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { name: '', kind: 'exercise', durationSec: 30, reps: 1, restDurationSec: 10, notes: '' },
    ]);
  };

  const updateStep = (idx: number, field: keyof WorkoutStep, value: any) => {
    setSteps((prev) => prev.map((step, i) => (i === idx ? { ...step, [field]: value } : step)));
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleKindChange = (idx: number, kind: (typeof stepKinds)[number]) => {
    setSteps(prev => prev.map((step, i) => {
      if (i !== idx) return step;
      if (kind === 'rest') {
        return {
          ...step,
          kind: 'rest',
          name: 'Rest',
          reps: 1,
          restDurationSec: 0,
          notes: '',
        };
      }
      // Leaving rest: allow editing name again; clear default 'Rest' name
      const newName = step.name === 'Rest' ? '' : step.name;
      return { ...step, kind, name: newName };
    }));
  };

  const loadTemplate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
  const tpl = await fetchTemplateById(token, templateId);
      setName(tpl.name || '');
      setSteps(Array.isArray(tpl.steps) ? tpl.steps : []);
  setIsPublic(!!tpl.isPublic);
    } catch (e: any) {
      setError(e?.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!name.trim()) throw new Error('Template name is required');
      if (steps.length === 0) throw new Error('Template must have at least one step');
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
  await updateTemplate(token, templateId, { name, steps, isPublic });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerToggleLabel}>Public</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.input.border, true: colors.button.activated }}
            thumbColor={colors.text.primary}
          />
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} />
      ) : (
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
                value={step.kind === 'rest' ? 'Rest' : (step.name || '')}
                editable={step.kind !== 'rest'}
                onChangeText={(v) => { if (step.kind !== 'rest') updateStep(idx, 'name', v); }}
              />
              <View style={styles.row}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stepKinds.map((kind) => (
                    <TouchableOpacity
                      key={kind}
                      style={[styles.kindButton, step.kind === kind && styles.kindButtonSelected]}
            onPress={() => handleKindChange(idx, kind as any)}
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
                onChangeText={(v) => updateStep(idx, 'durationSec', Number(v))}
              />
              {step.kind !== 'rest' && (
                <>
                  <Text style={styles.fieldLabel}>Repetitions</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Reps"
                    keyboardType="numeric"
                    value={step.reps?.toString() || ''}
                    onChangeText={(v) => updateStep(idx, 'reps', Number(v))}
                  />
                  <Text style={styles.fieldLabel}>Rest Duration (seconds)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Rest Duration (sec)"
                    keyboardType="numeric"
                    value={step.restDurationSec?.toString() || ''}
                    onChangeText={(v) => updateStep(idx, 'restDurationSec', Number(v))}
                  />
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Notes"
                    value={step.notes || ''}
                    onChangeText={(v) => updateStep(idx, 'notes', v)}
                  />
                </>
              )}
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
            style={[styles.submitButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  headerRight: {
    position: 'absolute',
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerToggleLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    marginRight: 8,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
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
    backgroundColor: colors.button.activated,
    borderColor: colors.button.activated,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
