import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { colors, typography } from '../theme';
import { fetchSharedTemplates, copyTemplate } from '../api/templates';
import MenuRow from '../components/MenuRow';

 type Props = NativeStackScreenProps<RootStackParamList, 'BrowseTemplates'>;

export default function BrowseTemplatesScreen({ navigation }: Props) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedWorkoutForMenu, setSelectedWorkoutForMenu] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const loadShared = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSharedTemplates();
      setWorkouts(list);
    } catch (e: any) {
    setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadShared(); }, [loadShared]);

  const filteredWorkouts = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Get the base list: either all workouts or those matching the query
    const baseList = !q
      ? workouts.slice()
      : workouts.filter((w) => {
          const name = String(w.name || '').toLowerCase();
          const owner = String(w.ownerUsername || w.owner || w.username || '').toLowerCase();
          return name.includes(q) || owner.includes(q);
        });

    // Partition to keep original relative order and put 'workoutapp' items first
    const appOwned: any[] = [];
    const others: any[] = [];
    for (const w of baseList) {
      const owner = String(w.ownerUsername || w.owner || w.username || '').toLowerCase();
      if (owner === 'workoutapp') appOwned.push(w);
      else others.push(w);
    }

    return [...appOwned, ...others];
  }, [workouts, query]);

  const handleMenuPress = (workout: any) => {
    setSelectedWorkoutForMenu(workout);
    setMenuModalVisible(true);
  };

  const closeModal = () => {
    setMenuModalVisible(false);
    setSelectedWorkoutForMenu(null);
  };

  const handleCopy = async () => {
    if (!selectedWorkoutForMenu) return;
    try {
      await copyTemplate(selectedWorkoutForMenu._id);
      closeModal();
      navigation.goBack();
    } catch (e) {
      closeModal();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSideLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Feather name="x" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        {showSearch ? (
          <View style={styles.headerCenter}>
            <View style={[styles.searchBar, { marginLeft: 6, marginRight: 4 }]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={colors.text.secondary}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setQuery('');
                  setShowSearch(false);
                }}
              >
                <Text style={styles.clearButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {!showSearch && <Text style={styles.headerTitleOverlay}>Browse</Text>}
        <View style={[styles.headerSideRight, showSearch && styles.headerSideRightCollapsed]}>
          {!showSearch && (
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowSearch(true)}>
              <Feather name="search" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.headerBorder} />

      {loading ? (
        <ActivityIndicator size="large" color={colors.text.primary} />
      ) : error ? (
        <Text style={{ color: colors.text.error, margin: 10 }}>{error}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {filteredWorkouts.map((workout) => (
            <MenuRow
              key={workout._id}
              title={workout.name}
              onPress={() => handleMenuPress(workout)}
              rightText={workout.ownerUsername || workout.owner || workout.username || ''}
            />
          ))}
        </ScrollView>
      )}

    <Modal visible={menuModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {selectedWorkoutForMenu?.name}
              {selectedWorkoutForMenu?.ownerUsername ? (
                <Text style={styles.modalSubtitleInline}>  by {selectedWorkoutForMenu.ownerUsername}</Text>
              ) : null}
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCopy}>
              <Text style={styles.modalButtonText}>Copy to My Workouts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    paddingBottom: 10,
    position: 'relative',
    height: 49,
  },
  headerBorder: {
    height: 3,
    backgroundColor: colors.border.primary,
    marginHorizontal: 10,
  },
  headerSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideLeft: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideRight: {
    width: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerSideRightCollapsed: {
    width: 8,
  },
  iconButton: {
    padding: 8,
  },
  backButton: { padding: 8 },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  headerTitleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
  height: 36,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    paddingVertical: 0,
  },
  clearButton: {
    paddingHorizontal: 8,
    marginLeft: 6,
  },
  clearButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  headerSpacer: { width: 40 },
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
  modalSubtitleInline: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
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
});
