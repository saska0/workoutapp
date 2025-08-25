import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Modal, Pressable, Animated, PanResponder, Dimensions, TextInput } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import TileBlock from '../components/TileBlock';
import WideButton from '../components/WideButton';
import { useSessionTimer } from '../context/SessionTimerContext';
import { useUserSessions } from '../context/SessionsContext';
import { colors, typography } from '../theme';
import { fetchSelectedTemplates } from '../api/templates';
import { postSession, type SessionData } from '../api/sessions';
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
  const { 
    elapsedSec, 
    startSession, 
    isRunning, 
    startTime: sessionStartTime, 
    completedWorkouts, 
    clearCompletedWorkouts,
    resetSession
  } = useSessionTimer();
  const { addSession } = useUserSessions();
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutTemplate[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [isLoggingSession, setIsLoggingSession] = useState(false);

  // Bottom sheet animation and gesture
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = Math.round(screenHeight * 0.45);
  // Notes modal animation (slides from top down to sit above the bottom sheet)
  const notesHeight = Math.round(screenHeight * 0.32);
  const notesTranslateY = useRef(new Animated.Value(-notesHeight)).current;
  const notesTargetTop = screenHeight - sheetHeight - notesHeight - 12; // 12px gap

  const closeEndSheet = useCallback(() => {
    closeNotesModal();
    Animated.timing(sheetTranslateY, {
      toValue: sheetHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setEndModalVisible(false);
    });
  }, [sheetHeight, sheetTranslateY]);

  const handleLogSession = useCallback(async () => {
    setIsLoggingSession(true);
    try {
      const sessionData: SessionData = {
        startedAt: sessionStartTime || new Date(),
        endedAt: new Date(),
        completedWorkouts,
        notes: sessionNotes.trim() || undefined,
      };
      const result = await postSession(sessionData);
      if (result) {
        addSession(result);
      }
      
      clearCompletedWorkouts();
      resetSession();
      setSessionNotes('');
      closeEndSheet();
      navigation.navigate('Main');
    } catch (error: any) {
      setError(error?.message || 'Failed to log session');
    } finally {
      setIsLoggingSession(false);
    }
  }, [completedWorkouts, sessionNotes, elapsedSec, sessionStartTime, clearCompletedWorkouts, resetSession, closeEndSheet, navigation]);

  const handleDiscardSession = useCallback(() => {
    clearCompletedWorkouts();
    resetSession();
    setSessionNotes('');
    closeEndSheet();
    navigation.navigate('Main');
  }, [clearCompletedWorkouts, resetSession, closeEndSheet, navigation]);


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
      const data = await fetchSelectedTemplates();
      setSelectedWorkouts(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load selected workouts');
    } finally {
      setLoading(false);
    }
  }, [selectedWorkouts.length]);

  const openNotesModal = useCallback(() => {
    setNotesModalVisible(true);
    // start above screen then slide down
    notesTranslateY.setValue(-notesHeight);
    Animated.timing(notesTranslateY, {
      toValue: notesTargetTop,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [notesHeight, notesTargetTop, notesTranslateY]);

  const closeNotesModal = useCallback(() => {
    Animated.timing(notesTranslateY, {
      toValue: -notesHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setNotesModalVisible(false));
  }, [notesHeight, notesTranslateY]);

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
                        _id: workout._id,
                        userId: workout.userId,
                        name: workout.name,
                        steps: workout.steps,
                      },
                    })
                  }
                />
              ))}
              {row.length === 1 && <View/>}
            </View>
          ))
        )}

        <View style={styles.row}>
          <TileBlock title="Edit" iconName='edit' onPress={() => navigation.navigate('EditMenu')} />
        </View>
        <View style={styles.row}>
          <TileBlock
            title="End Session"
            iconName='stop-circle'
            onPress={() => setEndModalVisible(true)}
            tileColor={colors.button.deactivated}
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
              <TileBlock 
                title="Add Notes"
                iconName='edit-2'
                onPress={() => {
                  if (notesModalVisible) {
                    closeNotesModal();
                  } else {
                    openNotesModal();
                  }
                }}
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TileBlock 
                title="Discard" 
                iconName='trash-2'
                onPress={handleDiscardSession} 
                tileColor={colors.button.deactivated}
              />
              <TileBlock 
                title={isLoggingSession ? "Logging..." : "Log Session"} 
                iconName='check-circle'
                onPress={handleLogSession} 
                tileColor={colors.button.activated}
              />
            </View>
            {completedWorkouts.length > 0 && (
              <Text style={styles.completedCount}>
                {completedWorkouts.length} workout{completedWorkouts.length !== 1 ? 's' : ''} completed
              </Text>
            )}
          </Animated.View>
          {/* Notes panel */}
          <Animated.View
            pointerEvents={notesModalVisible ? 'auto' : 'none'}
            style={[
              styles.notesPanel,
              { top: 0, height: notesHeight, zIndex: 10, transform: [{ translateY: notesTranslateY }] },
            ]}
          >
            <View style={styles.notesHeaderRow}>
            </View>
            <TextInput
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Type notes about this session..."
              placeholderTextColor={colors.text.secondary}
              multiline
              style={styles.notesInput}
            />
            <View style={styles.notesActionsRow}>
              <WideButton
                title="Clear"
                onPress={() => { setSessionNotes(''); }}
                backgroundColor={colors.button.deactivated}
                style={{ flex: 1, marginRight: 8 }}
                textColor={colors.text.primary}
              />
              <WideButton
                title="Done"
                onPress={closeNotesModal}
                backgroundColor={colors.button.activated}
                style={{ flex: 1 }}
                textColor={colors.text.primary}
              />
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
  modalTitle: {
    fontSize: typography.fontSize.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 36,
  },
  completedCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
  notesPanel: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: '32%',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesInput: {
    flex: 1,
    color: colors.text.primary,
    textAlignVertical: 'top',
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border.primary,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    marginBottom: 8,
  },
  notesActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notesActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  notesActionClear: {
    backgroundColor: colors.button.deactivated,
  },
  notesActionSave: {
    backgroundColor: colors.button.activated,
  },
  notesActionText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});
