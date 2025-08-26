import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { WorkoutStep } from '../types/workout';
import { getAuthToken } from '../api/auth';
import { colors, typography } from '../theme';
import WideButton from '../components/WideButton';
import StepForm from '../components/StepForm';
import NeoInput from '../components/NeoInput';

type Props = NativeStackScreenProps<RootStackParamList, any>;

export default function CreateTemplateScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<WorkoutStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const addStep = () => {
    setSteps([
      ...steps,
  { name: '', kind: 'exercise', durationSec: 30, reps: 1, restDurationSec: 10, notes: '' },
    ]);
  };

  const updateStep = (idx: number, field: keyof WorkoutStep, value: any) => {
    setSteps(steps => steps.map((step, i) => i === idx ? { ...step, [field]: value } : step));
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

  const handleBackPress = () => {
    // If no edits, go back 
    if (!name.trim() && steps.length === 0) {
      navigation.goBack();
      return;
    }
    setShowConfirmLeave(true);
  };

  const confirmDiscard = () => {
    setShowConfirmLeave(false);
    navigation.goBack();
  };

  const cancelDiscard = () => setShowConfirmLeave(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Template</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NeoInput
          placeholder="Template Name"
          value={name}
          onChangeText={setName}
          containerStyle={styles.inputSpacing}
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
          title={isSubmitting ? 'Creating...' : 'Create Template'}
          onPress={handleSubmit}
          backgroundColor={colors.button.activated}
          style={StyleSheet.flatten([
            styles.wideButtonSpacing, 
            isSubmitting && styles.buttonDisabled
          ])}
        />
      </ScrollView>

      <Modal
        visible={showConfirmLeave}
        transparent
        animationType="fade"
        onRequestClose={cancelDiscard}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Discard changes?</Text>
            <Text style={styles.modalMessage}>You have unsaved changes. Are you sure you want to discard them and leave?</Text>
            <View style={styles.modalButtons}>
              <WideButton
                title="Discard"
                onPress={confirmDiscard}
                backgroundColor={colors.button.deactivated}
                style={styles.wideButtonModal}
              />
              <WideButton
                title="Cancel"
                onPress={cancelDiscard}
                backgroundColor={colors.button.tileDefault}
                style={styles.wideButtonModal}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 14,
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
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  inputSpacing: {
    marginBottom: 8,
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
  wideButtonSpacing: {
    marginVertical: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.button.disabled,
  },
  errorContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 2,
    marginTop: 8,
    borderWidth: 3,
    borderColor: colors.border.primary,
  },
  error: {
    color: colors.text.error,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: colors.background.secondary,
    borderWidth: 3,
    borderColor: colors.border.primary,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wideButtonModal: {
    width: '48%',
  },
});
