import { View, StyleSheet } from 'react-native'
import TileBlock from '../components/TileBlock'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainMenu({ navigation }: Props) {
  return (
    <View style={styles.container}>
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
    paddingTop: 70,
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
})
