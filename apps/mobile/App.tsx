import { NavigationContainer } from '@react-navigation/native';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './src/navigation/AppNavigator';
import { queryClient } from './src/lib/queryClient';
import { initDb } from './src/lib/offlineCache';

// Wire React Query's online manager to NetInfo so queries auto-refetch on reconnect
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  }),
);

// Initialise SQLite cache tables once on module load
initDb();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
