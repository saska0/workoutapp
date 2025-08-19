import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Modal, Pressable, Animated, PanResponder, Dimensions } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TileBlock from '../components/TileBlock';
import { useSessionTimer } from '../context/SessionTimerContext';
import { colors, typography } from '../theme';
import { fetchSelectedTemplates } from '../api/templates';
import { getAuthToken } from '../api/auth';
import { useFocusEffect } from '@react-navigation/native';
import type { WorkoutTemplate } from '../types/workout';

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
  const { elapsedSec, startSession, isRunning } = useSessionTimer();
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [endModalVisible, setEndModalVisible] = useState(false);

  // Bottom sheet animation and gesture
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = Math.round(screenHeight * 0.45);

  const closeEndSheet = useCallback(() => {
    Animated.timing(sheetTranslateY, {
      toValue: sheetHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setEndModalVisible(false));
  }, [sheetHeight, sheetTranslateY]);


  useEffect(() => {
    if (!isRunning) startSession();
  }, []);

  // Animate sheet in when modal opens
  useEffect(() => {
    if (endModalVisible) {
      sheetTranslateY.setValue(sheetHeight);
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [endModalVisible, sheetHeight, sheetTranslateY]);

  // Swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx) && gesture.dy > 8,
      onMoveShouldSetPanResponderCapture: (_evt, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx) && gesture.dy > 8,
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy > 0) sheetTranslateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy > sheetHeight * 0.33 || gesture.vy > 0.9) {
          Animated.timing(sheetTranslateY, {
            toValue: sheetHeight,
            duration: 180,
            useNativeDriver: true,
          }).start(() => setEndModalVisible(false));
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const loadSelected = useCallback(async () => {
    // Show spinner only if we don't have any items yet
    setLoading(selectedWorkouts.length === 0);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const data = await fetchSelectedTemplates(token);
      setSelectedWorkouts(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load selected workouts');
    } finally {
      setLoading(false);
    }
  }, [selectedWorkouts.length]);

  useFocusEffect(
    useCallback(() => {
      loadSelected();
    }, [loadSelected])
  );

  const chunkIntoRows = (items: WorkoutTemplate[], size = 2) => {
    const rows: WorkoutTemplate[][] = [];
    for (let i = 0; i < items.length; i += size) {
      rows.push(items.slice(i, i + size));
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        {formatSessionTime(elapsedSec)}
      </Text>
      
      <ScrollView style={styles.scrollView}>
        {error && (
          <Text style={{ color: colors.text.error, marginBottom: 10 }}>{error}</Text>
        )}
        {loading && selectedWorkouts.length === 0 && (
          <ActivityIndicator size="large" color={colors.text.primary} />
        )}
        {!loading && selectedWorkouts.length === 0 && !error && (
          <Text style={{ color: colors.text.secondary, textAlign: 'center', marginVertical: 10 }}>
            No workouts selected. Tap Edit to choose workouts.
          </Text>
        )}
        {selectedWorkouts.length > 0 && (
          chunkIntoRows(selectedWorkouts, 2).map((row, idx) => (
            <View key={idx} style={styles.row}>
              {row.map((workout) => (
                <TileBlock
                  key={workout._id}
                  title={workout.name}
                  onPress={() =>
                    navigation.navigate('WorkoutTimer', {
                      workoutTemplate: {
                        userId: workout.userId,
                        name: workout.name,
                        steps: workout.steps,
                      },
                    })
                  }
                  style={styles.tileBlock}
                />
              ))}
              {row.length === 1 && <View style={[styles.tileBlock, styles.invisibleTile]} />}
            </View>
          ))
        )}

        <View style={styles.row}>
          <TileBlock title="Edit" onPress={() => navigation.navigate('EditMenu')} style={styles.tileBlock} />
        </View>
        <View style={styles.row}>
          <TileBlock
            title="End Session"
            onPress={() => setEndModalVisible(true)}
            style={styles.endSessionTile}
          />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={endModalVisible}
        onRequestClose={closeEndSheet}
      >
        <View style={styles.modalOverlay} {...panResponder.panHandlers}>
          <Pressable style={styles.modalBackdrop} onPress={closeEndSheet} />
          <Animated.View
            style={[styles.modalContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            <View style={styles.modalButtonsRow}>
              <TileBlock title="Add Notes" onPress={() => {}} />
            </View>
            <View style={styles.modalButtonsRow}>
              <TileBlock title="Discard" onPress={() => {}} style={styles.modalButtonDiscard} />
              <TileBlock title="Log Session" onPress={() => {}} style={styles.modalButtonLog} />
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    fontFamily: typography.fontFamily.monospace,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 20,
    marginTop: 50,
    color: colors.text.primary,
    textAlign: 'center',
    width: 200,
    alignSelf: 'center',
    backgroundColor: 'transparent',
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
  invisibleTile: {
    opacity: 0,
  },
  endSessionTile: {
    backgroundColor: colors.button.deactivated,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    height: '45%',
    backgroundColor: colors.background.primary,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtonLog: {
    backgroundColor: colors.button.activated,
  },
  modalButtonDiscard: {
    backgroundColor: colors.button.deactivated,
  },
  modalTitle: {
    fontSize: typography.fontSize.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 36,
  },
});
