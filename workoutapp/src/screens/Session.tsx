import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TileBlock from '../components/TileBlock';
import { useSessionTimer } from '../context/SessionTimerContext';

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
          <TileBlock title="Stretch 1" onPress={() => console.log('Stretch 1')} style={styles.tileBlock} />
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
    backgroundColor: '#333333',
  },
  timer: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 40,
    color: '#fff',
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
    backgroundColor: '#222',
  },
  endSessionTile: {
    backgroundColor: '#e74a3b',
  },
});