import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import TileBlock from '../components/TileBlock'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { removeAuthToken } from '../api/auth';
import { colors, typography } from '../theme';
import { useUserSessions } from '../context/SessionsContext';
import { useEffect, useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainMenuScreen({ navigation }: Props) {
  const { fetchSessions, clearSessions } = useUserSessions();

  // Fetch all user sessions when main menu loads
  useEffect(() => {
    fetchSessions();
  }, []);

  // Two-tap confirmation state for Logout
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  useEffect(() => {
    if (!logoutConfirmation) return;
    const t = setTimeout(() => setLogoutConfirmation(false), 5000);
    return () => clearTimeout(t);
  }, [logoutConfirmation]);

  const handleLogout = async () => {
    clearSessions();
    await removeAuthToken();
    navigation.replace('Welcome');
  };

  const handleLogoutPress = () => {
    if (!logoutConfirmation) {
      setLogoutConfirmation(true);
      return;
    }
    // Second tap: actually logout
    handleLogout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <View style={styles.row}>
        <TileBlock title="Start Session" iconName='play' onPress={() => navigation.navigate('Session')} />
        <TileBlock title="Calendar" iconName='calendar' onPress={() => navigation.navigate('Calendar')} />
      </View>
      <View style={styles.row}>
        <TileBlock title="Analytics" iconName='bar-chart' onPress={() => {}} />
      </View>
      <View style={styles.row}>
        <TileBlock title="Edit" iconName='edit' onPress={() => navigation.navigate('EditMenu')} />
        <TileBlock title="Log Metrics" iconName='clipboard' onPress={() => console.log('Metrics')}/>
      </View>
      <View style={styles.row}>
        <TileBlock title="Settings" iconName='settings' onPress={() => navigation.navigate('EditMenu')} />
        <TileBlock 
          title={logoutConfirmation ? 'Confirm Logout' : 'Logout'} 
          iconName='log-out' 
          onPress={handleLogoutPress}
          tileColor={logoutConfirmation ? colors.button.deactivated : undefined}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: colors.background.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    paddingVertical: 20,
  },
  logoutButton: {
    backgroundColor: colors.border.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutButtonConfirm: {
    backgroundColor: colors.button.deactivated,
  },
  logoutText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
})
