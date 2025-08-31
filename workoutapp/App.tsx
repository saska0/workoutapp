import { SessionTimerProvider } from './src/context/SessionTimerContext';
import { SessionsProvider } from './src/context/SessionsContext';
import { AnalyticsProvider } from './src/context/AnalyticsContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import MainMenuScreen from './src/screens/MainMenuScreen';
import SessionScreen from './src/screens/SessionScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkoutTimerScreen from './src/screens/WorkoutTimerScreen';
import { RootStackParamList } from './src/types/navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import EditMenuScreen from '@screens/EditMenuScreen';
import CreateTemplateScreen from './src/screens/CreateTemplateScreen';
import EditTemplateScreen from './src/screens/EditTemplateScreen';
import BrowseTemplatesScreen from './src/screens/BrowseTemplatesScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import MetricsScreen from './src/screens/MetricsScreen';
import AnalyticScreen from './src/screens/AnalyticScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AnalyticsProvider>
    <SessionsProvider>
    <SessionTimerProvider>
      <View style={styles.container}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome">
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ 
                headerShown: false, 
                gestureEnabled: false,
                animation: 'none',
               }}
             />
            <Stack.Screen 
              name="Main" 
              component={MainMenuScreen} 
              options={{ 
                headerShown: false, 
                gestureEnabled: false,
                animation: 'none',
               }}
             />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
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
            <Stack.Screen 
              name="EditMenu" 
              component={EditMenuScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen 
              name="WorkoutTimer" 
              component={WorkoutTimerScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen 
              name="CreateTemplate" 
              component={CreateTemplateScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="BrowseTemplates" 
              component={BrowseTemplatesScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="EditTemplate" 
              component={EditTemplateScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="Calendar" 
              component={CalendarScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen 
              name="Agenda" 
              component={AgendaScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="Metrics" 
              component={MetricsScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="Analytics" 
              component={AnalyticScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View> 
    </SessionTimerProvider>
    </SessionsProvider>
    </AnalyticsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
