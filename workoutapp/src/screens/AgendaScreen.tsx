import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useUserSessions } from '../context/SessionsContext';
import { colors, typography } from '../theme';

type AgendaScreenRouteProp = RouteProp<RootStackParamList, 'Agenda'>;

export default function AgendaScreen() {
	const route = useRoute<AgendaScreenRouteProp>();
	const navigation = useNavigation();
	const { sessions } = useUserSessions();

	// Default to today (YYYY-MM-DD) if no param was provided
	const selectedDate = useMemo(
		() => route.params?.selectedDate ?? new Date().toISOString().split('T')[0],
		[route.params]
	);

	const formattedTitleDate = useMemo(() => {
		const parts = selectedDate.split('-').map(Number);
		if (parts.length !== 3) return selectedDate;
		const [year, month, day] = parts;
		if (!year || !month || !day) return selectedDate;
		const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		const dd = String(day).padStart(2, '0');
		return `${dd}. ${MONTHS_SHORT[month - 1]} ${year}`;
	}, [selectedDate]);

	// Completed sessions that started on the selected date
	const sessionsForDay = useMemo(() => {
		return sessions
			.filter(s => !!s.endedAt && s.startedAt.split('T')[0] === selectedDate)
			.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
	}, [sessions, selectedDate]);

		const formatDuration = (ms: number): string => {
			const totalMinutes = Math.max(0, Math.floor(ms / 60000));
			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;
			return hours > 0 ? `${hours}h ${minutes}m` : `${totalMinutes} min`;
		};

	const renderSession = ({ item }: { item: typeof sessionsForDay[number] }) => {
		const start = new Date(item.startedAt);
		const end = item.endedAt ? new Date(item.endedAt) : undefined;
		const timeRange = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}`;
			const durationText = end ? formatDuration(end.getTime() - start.getTime()) : '—';
		return (
			<View style={styles.sessionCard}>
					<Text style={styles.sessionTitle}>{durationText}</Text>
				<Text style={styles.sessionTime}>{timeRange}</Text>
				{item.notes ? <Text style={styles.sessionNotes}>{item.notes}</Text> : null}
				{item.completedWorkouts?.length ? (
					<View style={styles.workoutsBlock}>
						{item.completedWorkouts.map((w, idx) => (
							<View key={`${item._id}-${idx}`} style={styles.workoutRow}>
								<Text style={styles.workoutName}>{w.name}</Text>
								{typeof w.durationSec === 'number' ? (
									<Text style={styles.workoutMeta}>{Math.round(w.durationSec / 60)} min</Text>
								) : null}
							</View>
						))}
					</View>
				) : null}
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
					<Text style={styles.backButtonText}>✕</Text>
				</TouchableOpacity>
				<Text style={styles.title}>{formattedTitleDate}</Text>
				<View style={styles.spacer} />
			</View>
			<FlatList
				data={sessionsForDay}
				keyExtractor={(item) => item._id}
				renderItem={renderSession}
				contentContainerStyle={styles.listContent}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background.primary },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingBottom: 12,
		paddingTop: 3,
		backgroundColor: colors.background.primary,
	},
	backButton: { padding: 8 },
	backButtonText: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
	title: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, flex: 1, textAlign: 'center' },
	spacer: { width: 31 },
	listContent: { padding: 12 },
	sessionCard: { backgroundColor: colors.background.secondary, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 3, borderColor: colors.border.primary },
	sessionTitle: { color: colors.text.primary, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
	sessionTime: { color: colors.text.secondary, marginTop: 4 },
	sessionNotes: { color: colors.text.secondary, marginTop: 6, fontStyle: 'italic' },
	workoutsBlock: { marginTop: 10, gap: 6 },
	workoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, },
	workoutName: { color: colors.text.primary },
	workoutMeta: { color: colors.text.secondary },
	emptyWorkouts: { color: colors.text.secondary, marginTop: 8 },
	emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	emptyStateText: { color: colors.text.secondary },
});
