import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import MenuRow from '../components/MenuRow';
import { fetchTemplates } from '../api/templates';
import TileBlock from '@components/TileBlock';
import SwipeRow from '@nghinv/react-native-swipe-row';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditMenu'>;

export default function EditMenu({ navigation }: Props) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then(setWorkouts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Workouts</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={styles.row}>
        <TileBlock title="Create" onPress={() => console.log('Create')} style={styles.tileBlock} />
        <TileBlock title="Browse" onPress={() => console.log('Browse')} style={styles.tileBlock} />
      </View>
      {loading ? (
        <ActivityIndicator testID="loading-indicator" size="large" color={colors.text.primary} />
      ) : error ? (
        <Text style={{ color: colors.text.error, marginBottom: 10 }}>{error}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {workouts.map((workout) => (
            <SwipeRow
              key={workout._id}
              right={[
                {
                  title: 'Edit',
                  backgroundColor: '#b388ff',
                },
                {
                  title: 'Delete',
                  backgroundColor: 'tomato',
                },
              ]}
              style={{ marginVertical: 1 }}
            >
              <View style={styles.row}>
                <MenuRow
                  title={workout.name}
                  onPress={() => {}}
                />
              </View>
            </SwipeRow>
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
  row: {
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
