import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { WorkoutStep } from '../types/workout';
import { colors, typography } from '../theme';
import NeoInput from './NeoInput';

const stepKinds = ['exercise', 'stretch', 'rest'] as const;

interface StepFormProps {
  steps: WorkoutStep[];
  onUpdateStep: (idx: number, field: keyof WorkoutStep, value: any) => void;
  onRemoveStep: (idx: number) => void;
  onKindChange: (idx: number, kind: (typeof stepKinds)[number]) => void;
}

export default function StepForm({ steps, onUpdateStep, onRemoveStep, onKindChange }: StepFormProps) {
  const handleEditField = (stepIdx: number, field: keyof WorkoutStep, currentValue: any, label: string) => {
    Alert.prompt(
      `Edit ${label}`,
      `Enter new ${label.toLowerCase()}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (value) => {
            if (value !== undefined && value !== null) {
              if (field === 'notes') {
                onUpdateStep(stepIdx, field, value);
              } else {
                const numericValue = Number(value);
                if (isNaN(numericValue) || numericValue < 0) {
                  Alert.alert('Invalid Input', 'Please enter a valid positive number.');
                  return;
                }
                onUpdateStep(stepIdx, field, numericValue);
              }
            }
          }
        }
      ],
      'plain-text',
      currentValue?.toString() || ''
    );
  };
  return (
    <>
      {steps.map((step, idx) => (
        <View key={idx} style={styles.stepWrapper}>
          <View style={styles.shadow} />
          <View style={styles.stepContainer}>
          <View style={styles.nameRow}>
            <NeoInput
              placeholder="Step Name"
              value={step.kind === 'rest' ? 'Rest' : (step.name || '')}
              editable={step.kind !== 'rest'}
              onChangeText={v => { if (step.kind !== 'rest') onUpdateStep(idx, 'name', v); }}
              containerStyle={styles.nameInputContainer}
            />
            <TouchableOpacity 
              style={styles.removeButtonCompact} 
              onPress={() => onRemoveStep(idx)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.fieldsRow}>
            <TouchableOpacity
              style={styles.fieldBlock}
              onPress={() => handleEditField(idx, 'durationSec', step.durationSec, 'Duration')}
            >
              <Text style={styles.blockLabel}>Duration</Text>
              <Text style={styles.blockValue}>{step.durationSec || 0}s</Text>
            </TouchableOpacity>
            
            {step.kind !== 'rest' && (
              <>
                <TouchableOpacity
                  style={styles.fieldBlock}
                  onPress={() => handleEditField(idx, 'reps', step.reps, 'Reps')}
                >
                  <Text style={styles.blockLabel}>Reps</Text>
                  <Text style={styles.blockValue}>{step.reps || 1}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.fieldBlock}
                  onPress={() => handleEditField(idx, 'restDurationSec', step.restDurationSec, 'Rest Duration')}
                >
                  <Text style={styles.blockLabel}>Rest</Text>
                  <Text style={styles.blockValue}>{step.restDurationSec || 0}s</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {step.kind !== 'rest' && (
            <>
              <NeoInput
                placeholder="Notes"
                value={step.notes || ''}
                onChangeText={v => onUpdateStep(idx, 'notes', v)}
                containerStyle={styles.inputSpacing}
              />
            </>
          )}
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  stepWrapper: {
    position: 'relative',
    marginBottom: 7,
  },
  stepContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 3,
    borderColor: colors.border.primary,
    position: 'relative',
    zIndex: 2,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.border.primary,
    borderRadius: 8,
    zIndex: 1,
  },
  fieldLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
    marginTop: 8,
  },
  inputSpacing: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  nameInputContainer: {
    flex: 1,
  },
  removeButtonCompact: {
    backgroundColor: colors.button.disabled,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.primary,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 45,
    shadowColor: colors.border.primary,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  removeButtonText: {
    color: colors.text.error,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.xs,
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
  fieldsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  fieldBlock: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.border.primary,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  blockLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  blockValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
