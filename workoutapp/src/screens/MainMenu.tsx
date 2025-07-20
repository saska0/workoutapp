import { View, StyleSheet } from 'react-native'
import TileBlock from '../components/TileBlock'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainMenu({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TileBlock title="Start Session" onPress={() => navigation.navigate('Session')} style={{ backgroundColor: '#6C8EBF' }} />
        <TileBlock title="Calendar" onPress={() => {}} style={{ backgroundColor: '#7FB77E' }} />
      </View>
      <View style={styles.row}>
        <TileBlock title="Analytics" onPress={() => {}} style={{ backgroundColor: '#7ED6DF' }} />
      </View>
      <View style={styles.row}>
        <TileBlock title="Edit" onPress={() => console.log('Edit')} style={{ backgroundColor: '#F7D794' }} />
        <TileBlock title="Settings" onPress={() => console.log('Settings')} style={{ backgroundColor: '#A5B1C2' }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 10,
    backgroundColor: '#333333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
