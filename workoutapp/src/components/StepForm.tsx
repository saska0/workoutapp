import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { WorkoutStep } from '../types/workout';
import { colors, typography } from '../theme';

const stepKinds = ['exercise', 'stretch', 'rest'] as const;

interface StepFormProps {
  steps: WorkoutStep[];
  onUpdateStep: (idx: number, field: keyof WorkoutStep, value: any) => void;
  onRemoveStep: (idx: number) => void;
  onKindChange: (idx: number, kind: (typeof stepKinds)[number]) => void;
}

export default function StepForm({ steps, onUpdateStep, onRemoveStep, onKindChange }: StepFormProps) {
  return (
    <>
      {steps.map((step, idx) => (
        <View key={idx} style={styles.stepContainer}>
          <TextInput
            style={styles.input}
            placeholder="Step Name"
            value={step.kind === 'rest' ? 'Rest' : (step.name || '')}
            editable={step.kind !== 'rest'}
            onChangeText={v => { if (step.kind !== 'rest') onUpdateStep(idx, 'name', v); }}
          />
          <View style={styles.row}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stepKinds.map(kind => (
                <TouchableOpacity
                  key={kind}
                  style={[styles.kindButton, step.kind === kind && styles.kindButtonSelected]}
                  onPress={() => onKindChange(idx, kind)}
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
            onChangeText={v => onUpdateStep(idx, 'durationSec', Number(v))}
          />
          {step.kind !== 'rest' && (
            <>
              <Text style={styles.fieldLabel}>Repetitions</Text>
              <TextInput
                style={styles.input}
                placeholder="Reps"
                keyboardType="numeric"
                value={step.reps?.toString() || ''}
                onChangeText={v => onUpdateStep(idx, 'reps', Number(v))}
              />
              <Text style={styles.fieldLabel}>Rest Duration (seconds)</Text>
              <TextInput
                style={styles.input}
                placeholder="Rest Duration (sec)"
                keyboardType="numeric"
                value={step.restDurationSec?.toString() || ''}
                onChangeText={v => onUpdateStep(idx, 'restDurationSec', Number(v))}
              />
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="Notes"
                value={step.notes || ''}
                onChangeText={v => onUpdateStep(idx, 'notes', v)}
              />
            </>
          )}
          <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveStep(idx)}>
            <Text style={styles.removeButtonText}>Remove Step</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border.primary,
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
});
