import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView } from 'react-native';
import MenuRow from '../components/MenuRow';
import { fetchTemplates } from '../api/templates';
import TileBlock from '@components/TileBlock';
import SwipeRow from '@nghinv/react-native-swipe-row';

export default function EditMenu() {
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
        <View style={styles.row}>
          <TileBlock title="Create" onPress={() => console.log('Create')} style={styles.tileBlock} />
          <TileBlock title="Browse" onPress={() => console.log('Browse')} style={styles.tileBlock} />
        </View>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : error ? (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
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
    backgroundColor: '#333',
    paddingTop: 70,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  tileBlock: {
    backgroundColor: '#222',
  },
  scrollView: {
    flex: 1,
    marginTop: 10,
    backgroundColor: '#222',
  },
});
