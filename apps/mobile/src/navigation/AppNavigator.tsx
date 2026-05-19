import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';

// ── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

type MainTabParamList = {
  Accueil: undefined;
  Clients: undefined;
  Cloud: undefined;
  Commandes: undefined;
  SAV: undefined;
};

// ── Placeholder screen factory ───────────────────────────────────────────────

function makePlaceholder(label: string) {
  return function PlaceholderScreen() {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{label} — à venir</Text>
      </View>
    );
  };
}

// ── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#16213e', borderTopColor: '#2a2a4a' },
        tabBarActiveTintColor: '#00e5cc',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={makePlaceholder('Accueil')}
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Clients"
        component={makePlaceholder('Clients')}
        options={{ tabBarLabel: 'Clients', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text> }}
      />
      <Tab.Screen
        name="Cloud"
        component={makePlaceholder('Cloud')}
        options={{ tabBarLabel: 'Cloud', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>☁️</Text> }}
      />
      <Tab.Screen
        name="Commandes"
        component={makePlaceholder('Commandes')}
        options={{ tabBarLabel: 'Commandes', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛒</Text> }}
      />
      <Tab.Screen
        name="SAV"
        component={makePlaceholder('SAV')}
        options={{ tabBarLabel: 'SAV', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔧</Text> }}
      />
    </Tab.Navigator>
  );
}

// ── Root stack navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1a1a2e' } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainNavigator} />
    </Stack.Navigator>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#aaa', fontSize: 16 },
});
