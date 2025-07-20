import { SessionTimerProvider } from './src/context/SessionTimerContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import MainMenu from './src/screens/MainMenu';
import SessionScreen from './src/screens/Session';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SessionTimerProvider>
      <View style={styles.container}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Main">
            <Stack.Screen 
              name="Main" 
              component={MainMenu} 
              options={{ 
                headerShown: false, 
                gestureEnabled: false,
                animation: 'none',
               }}
             />
            <Stack.Screen 
              name="Session" 
              component={SessionScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
                animation: 'slide_from_bottom',
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View> 
    </SessionTimerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
});
