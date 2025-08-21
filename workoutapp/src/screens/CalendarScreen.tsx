import React, { useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { useUserSessions } from '../context/SessionsContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;

export default function CalendarScreen() {
	const navigation = useNavigation<CalendarScreenNavigationProp>();
	const { sessions } = useUserSessions();

	// Dates that have at least one completed session (has endedAt)
	const completedDatesSet = useMemo(() => {
		const s = new Set<string>();
		sessions.forEach(session => {
			if (session.endedAt) {
				s.add(session.startedAt.split('T')[0]);
			}
		});
		return s;
	}, [sessions]);

	const onDayPress = (day: any) => {
		if (completedDatesSet.has(day.dateString)) {
			navigation.navigate('Agenda', { selectedDate: day.dateString });
		}
	};

	// Calculate dynamic scroll ranges
	const { pastScrollRange, futureScrollRange } = useMemo(() => {
		if (sessions.length === 0) {
			return { pastScrollRange: 2, futureScrollRange: 2 }; // Default when no sessions
		}

		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth();

		const earliestSession = sessions.reduce((earliest, session) => {
			const sessionDate = new Date(session.startedAt);
			const earliestDate = new Date(earliest.startedAt);
			return sessionDate < earliestDate ? session : earliest;
		});

		const earliestDate = new Date(earliestSession.startedAt);
		const earliestYear = earliestDate.getFullYear();
		const earliestMonth = earliestDate.getMonth();

		// Calculate months from earliest session to current month
		const monthsBack = (currentYear - earliestYear) * 12 + (currentMonth - earliestMonth);
		
		return {
			pastScrollRange: Math.max(1, monthsBack + 1), // +1 for buffer
			futureScrollRange: 2
		};
	}, [sessions]);

	// Mark only completed-session dates
	const markedDates = useMemo(() => {
		const marked: Record<string, { selected: boolean; selectedColor: string }> = {};
		completedDatesSet.forEach(date => {
			marked[date] = {
				selected: true,
				selectedColor: colors.border.primary,
			};
		});
		return marked;
	}, [completedDatesSet]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}> 
				<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				  <Feather name="x" size={20} color={colors.text.primary} />
				</TouchableOpacity>
				<Text style={styles.title}>Calendar</Text>
				<View style={styles.spacer} />
			</View>
			<CalendarList
				minDate={undefined}
				maxDate={undefined}
				pastScrollRange={pastScrollRange}
				futureScrollRange={futureScrollRange}
				firstDay={1}
				horizontal={false}
				markedDates={markedDates}
				onDayPress={onDayPress}
				theme={{
					backgroundColor: colors.background.secondary,
					calendarBackground: colors.background.secondary,
					textSectionTitleColor: colors.text.secondary,
					dayTextColor: colors.text.primary,
					textDisabledColor: colors.text.placeholder,
					arrowColor: colors.text.primary,
					monthTextColor: colors.text.primary,
					textMonthFontWeight: typography.fontWeight.semibold as any,
					textDayFontSize: typography.fontSize.md,
					textMonthFontSize: typography.fontSize.lg,
					textDayHeaderFontSize: typography.fontSize.sm,
				}}
				style={styles.calendar}
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
	  borderBottomWidth: 5,
	  borderColor: colors.border.primary,
    },
    backButton: {
      padding: 8,
    },
	title: { 
		color: colors.text.primary, 
		fontSize: typography.fontSize.lg, 
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
		textAlign: 'center'
	},
	spacer: { width: 31 },
	calendar: { backgroundColor: colors.background.secondary },
});

