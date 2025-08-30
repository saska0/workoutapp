import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import MenuRow from '../components/MenuRow';
import SwipeableRow from '../components/SwipeableRow';
import { fetchUserTemplates, fetchSelectedTemplates, updateSelectedTemplates, deleteTemplate } from '../api/templates';
import TileBlock from '@components/TileBlock';
import WideButton from '../components/WideButton';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditMenu'>;

export default function EditMenuScreen({ navigation }: Props) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedWorkoutForMenu, setSelectedWorkoutForMenu] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const fetchTemplates = useCallback(async () => {
    // Show spinner only if we don't have any items yet
    setLoading(workouts.length === 0);
    setError(null);
    try {
      const [templatesData, selectedData] = await Promise.all([
        fetchUserTemplates(),
        fetchSelectedTemplates()
      ]);
      
      // Convert selected templates array to Set of IDs
      const selectedIds = new Set<string>(selectedData.map((template: any) => template._id as string));
      
      // Sort workouts with selected ones at the top (only on initial load)
      const sortedTemplates = [...templatesData].sort((a, b) => {
        const aSelected = selectedIds.has(a._id);
        const bSelected = selectedIds.has(b._id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return 0;
      });
      
      setWorkouts(sortedTemplates);
      setSelectedWorkouts(selectedIds);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [workouts.length]);

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [fetchTemplates])
  );

  const handleActivate = async (workout: any) => {
    const newSelected = new Set(selectedWorkouts);
    
    if (newSelected.has(workout._id)) {
      newSelected.delete(workout._id);
    } else {
      newSelected.add(workout._id);
    }
    
    // Optimistically update UI
    setSelectedWorkouts(newSelected);
    
    try {     
      await updateSelectedTemplates(Array.from(newSelected));
    } catch (err) {
      setSelectedWorkouts(selectedWorkouts);
      console.error('Failed to update selection:', err);
      setError('Failed to save selection changes');
    }
  };

  const handleMenuPress = (workout: any) => {
    setSelectedWorkoutForMenu(workout);
    setDeleteConfirmation(false);
    setMenuModalVisible(true);
  };

  const handleEditWorkout = () => {
    setMenuModalVisible(false);
    if (selectedWorkoutForMenu) {
      navigation.navigate('EditTemplate', { templateId: selectedWorkoutForMenu._id });
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteConfirmation) {
      // First press: Show confirmation state
      setDeleteConfirmation(true);
      return;
    }
    
    // Second press: Actually delete
    setMenuModalVisible(false);
    if (selectedWorkoutForMenu) {
      try {
        await deleteTemplate(selectedWorkoutForMenu._id);
        // Remove from local state
        setWorkouts(workouts.filter(w => w._id !== selectedWorkoutForMenu._id));
        setSelectedWorkouts(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedWorkoutForMenu._id);
          return newSet;
        });
      } catch (err) {
        console.error('Failed to delete workout:', err);
        setError('Failed to delete workout');
      }
    }
  };

  const closeModal = () => {
    setMenuModalVisible(false);
    setSelectedWorkoutForMenu(null);
    setDeleteConfirmation(false);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Workouts</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={styles.tileRow}>
        <TileBlock title="Create" iconName='plus' onPress={() => navigation.navigate('CreateTemplate')} />
        <TileBlock title="Browse" iconName='search' onPress={() => navigation.navigate('BrowseTemplates')} />
      </View>
      {loading ? (
        <ActivityIndicator testID="loading-indicator" size="large" color={colors.text.primary} />
      ) : error ? (
        <Text style={{ color: colors.text.error, marginBottom: 10 }}>{error}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {workouts.map((workout) => (
            <SwipeableRow
              key={workout._id}
              onActivate={() => handleActivate(workout)}
              isSelected={selectedWorkouts.has(workout._id)}
            >
              <MenuRow
                title={workout.name}
                onPress={() => handleMenuPress(workout)}
                showMenuIcon
                isSelected={selectedWorkouts.has(workout._id)}
              />
            </SwipeableRow>
          ))}
        </ScrollView>
      )}
      
      <Modal
        visible={menuModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeModal}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {selectedWorkoutForMenu?.name}
            </Text>
            
            <WideButton 
              title={selectedWorkoutForMenu && selectedWorkouts.has(selectedWorkoutForMenu._id) ? 'Deselect' : 'Select'}
              onPress={() => {
                if (selectedWorkoutForMenu) {
                  handleActivate(selectedWorkoutForMenu);
                }
              }}
              backgroundColor={colors.button.activated}
              style={styles.wideButton}
            />

            <WideButton 
              title="Edit" 
              onPress={handleEditWorkout}
              backgroundColor={colors.button.dark}
              style={styles.wideButton}
            />
            
            <WideButton 
              title={deleteConfirmation ? 'Confirm Delete' : 'Delete'}
              onPress={handleDeleteWorkout}
              backgroundColor={deleteConfirmation ? colors.button.deactivated : colors.button.dark}
              style={styles.wideButton}
            />
            
            <WideButton 
              title="Cancel" 
              onPress={closeModal}
              textColor={colors.text.secondary}
              backgroundColor={colors.button.tileDefault}
              style={styles.wideButton}
            />
          </TouchableOpacity>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  backButton: {
    padding: 8,
    paddingRight: 16,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.title_s,
    fontWeight: typography.fontWeight.semibold,
  },
  headerSpacer: {
    width: 40,
  },
  tileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: 10,
    backgroundColor: colors.background.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.border.primary,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: colors.button.dark,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 6,
  },
  modalButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: colors.button.dark,
  },
  confirmDeleteButton: {
    backgroundColor: colors.button.deactivated,
  },
  deleteButtonText: {
    color: colors.text.primary,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  cancelButtonStyle: {
    marginTop: 8,
  },
  wideButton: {
    marginBottom: 10,
  },
});
