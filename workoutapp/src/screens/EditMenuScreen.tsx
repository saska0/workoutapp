import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import MenuRow from '../components/MenuRow';
import SwipeableRow from '../components/SwipeableRow';
import { fetchUserTemplates, fetchSelectedTemplates, updateSelectedTemplates } from '../api/templates';
import { getAuthToken } from '../api/auth';
import TileBlock from '@components/TileBlock';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditMenu'>;

export default function EditMenuScreen({ navigation }: Props) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      
      const [templatesData, selectedData] = await Promise.all([
        fetchUserTemplates(token),
        fetchSelectedTemplates(token)
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
  }, []);

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
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      
      await updateSelectedTemplates(token, Array.from(newSelected));
    } catch (err) {
      // Revert on error
      setSelectedWorkouts(selectedWorkouts);
      console.error('Failed to update selection:', err);
      setError('Failed to save selection changes');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Workouts</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={styles.tileRow}>
  <TileBlock title="Create" onPress={() => navigation.navigate('CreateTemplate')} style={styles.tileBlock} />
        <TileBlock title="Browse" onPress={() => console.log('Browse')} style={styles.tileBlock} />
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
                onPress={() => {}}
                isSelected={selectedWorkouts.has(workout._id)}
              />
            </SwipeableRow>
          ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  backButton: {
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
  headerSpacer: {
    width: 40,
  },
  tileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  tileBlock: {
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
    marginTop: 10,
    backgroundColor: colors.background.secondary,
  },
});
