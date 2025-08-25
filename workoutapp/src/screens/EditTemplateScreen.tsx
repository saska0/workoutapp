import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { WorkoutStep } from '../types/workout';
import { colors, typography } from '../theme';
import { fetchTemplateById, updateTemplate } from '../api/templates';
import WideButton from '../components/WideButton';
import StepForm from '../components/StepForm';

type Props = NativeStackScreenProps<RootStackParamList, 'EditTemplate'>;

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

  const handleKindChange = (idx: number, kind: 'exercise' | 'stretch' | 'rest') => {
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
      const tpl = await fetchTemplateById(templateId);
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
      await updateTemplate(templateId, { name, steps, isPublic });
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
          
          <StepForm
            steps={steps}
            onUpdateStep={updateStep}
            onRemoveStep={removeStep}
            onKindChange={handleKindChange}
          />
          
          <WideButton 
            title="+ Add Step" 
            onPress={addStep}
            backgroundColor={colors.button.tileDefault}
            style={styles.wideButtonSpacing}
          />
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}
          
          <WideButton 
            title={saving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            backgroundColor={colors.button.activated}
            style={StyleSheet.flatten([
              styles.wideButtonSpacing, 
              saving && styles.buttonDisabled
            ])}
          />
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
    paddingLeft: 3,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    top: 0,
    padding: 8,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.title_s,
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
  input: {
    backgroundColor: colors.input.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kindButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.background.primary,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.border.primary,
    shadowColor: colors.border.primary,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  kindButtonSelected: {
    backgroundColor: colors.button.activated,
    borderColor: colors.border.primary,
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 0, height: 0 },
  },
  kindText: {
    color: colors.text.primary,
  },
  kindTextSelected: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
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
    fontWeight: typography.fontWeight.bold,
  },
  wideButtonSpacing: {
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.border.primary,
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
