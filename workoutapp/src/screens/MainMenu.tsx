import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import TileBlock from '../components/TileBlock'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { removeAuthToken } from '../api/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainMenu({ navigation }: Props) {
  const handleLogout = async () => {
    await removeAuthToken();
    navigation.replace('Welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TileBlock title="Start Session" onPress={() => navigation.navigate('Session')} style={styles.tileBlock} />
        <TileBlock title="Calendar" onPress={() => {}} style={styles.tileBlock} />
      </View>
      <View style={styles.row}>
        <TileBlock title="Analytics" onPress={() => {}} style={styles.tileBlock} />
      </View>
      <View style={styles.row}>
        <TileBlock title="Edit" onPress={() => navigation.navigate('EditMenu')} style={styles.tileBlock} />
        <TileBlock title="Settings" onPress={() => console.log('Settings')} style={styles.tileBlock} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: '#333333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileBlock: {
    backgroundColor: '#222',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#444444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '500',
  },
})
