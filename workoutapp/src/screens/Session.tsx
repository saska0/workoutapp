import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TileBlock from '../components/TileBlock';
import { useSessionTimer } from '../context/SessionTimerContext';
import { colors, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

function formatSessionTime(seconds: number): string {
  if (seconds < 3600) {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  } else {
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }
}

export default function SessionScreen({ navigation }: Props) {
  const { elapsedSec, startSession, endSession, isRunning } = useSessionTimer();

  useEffect(() => {
    if (!isRunning) startSession();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        {formatSessionTime(elapsedSec)}
      </Text>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.row}>
          <TileBlock 
            title="Stretch 1" 
            onPress={() => navigation.navigate('WorkoutTimer', {
              workoutTemplate: {
                name: 'Stretch 1',
                steps: [
                  {
                    name: '1',
                    kind: 'stretch',
                    durationSec: 30,
                    reps: 3,
                    restDurationSec: 15,
                    notes: '111'
                  },
                  {
                    name: '2',
                    kind: 'stretch',
                    durationSec: 45,
                    reps: 2,
                    restDurationSec: 20,
                    notes: '222'
                  },
                  {
                    name: '3',
                    kind: 'stretch',
                    durationSec: 30,
                    reps: 3,
                    restDurationSec: 10,
                    notes: '333'
                  },
                  {
                    name: '4',
                    kind: 'stretch',
                    durationSec: 40,
                    reps: 2,
                    restDurationSec: 25,
                    notes: '444'
                  },
                  {
                    name: '5',
                    kind: 'stretch',
                    durationSec: 35,
                    reps: 3,
                    restDurationSec: 12,
                    notes: '555'
                  }
                ]
              }
            })} 
            style={styles.tileBlock} 
          />
          <TileBlock title="Stretch 2" onPress={() => console.log('Stretch 2')} style={styles.tileBlock} />
        </View>
        <View style={styles.row}>
          <TileBlock title="Edit" onPress={() => navigation.navigate('EditMenu')} style={styles.tileBlock} />
        </View>
        <View style={styles.row}>
          <TileBlock
            title="End Session"
            onPress={() => {
              endSession();
              navigation.navigate('Main');
            }}
            style={styles.endSessionTile}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  timer: {
    fontSize: typography.fontSize.timer,
    marginBottom: 20,
    marginTop: 40,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileBlock: {
    backgroundColor: colors.background.secondary,
  },
  endSessionTile: {
    backgroundColor: '#e74a3b',
  },
});