import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import CreateClientScreen from '../screens/CreateClientScreen';
import QrScannerScreen from '../screens/QrScannerScreen';
import CloudScreen from '../screens/CloudScreen';
import CloudDetailScreen from '../screens/CloudDetailScreen';
import CreateSubscriptionScreen from '../screens/CreateSubscriptionScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import PaymentWebViewScreen from '../screens/PaymentWebViewScreen';
import StockScreen from '../screens/StockScreen';

// ── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientDetail: { id: string };
  CreateClient: undefined;
  QrScanner: undefined;
};

export type CloudStackParamList = {
  CloudList: undefined;
  CloudDetail: { id: string };
  CreateSubscription: { clientId?: string; clientName?: string };
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { id: string };
  CreateOrder: { clientId?: string };
  PaymentInit: { orderId: string; total: number };
};

type MainTabParamList = {
  Accueil: undefined;
  Clients: undefined;
  Cloud: undefined;
  Commandes: undefined;
  Stock: undefined;
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

// ── Orders stack ─────────────────────────────────────────────────────────────

const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#16213e' },
        headerTintColor: '#00e5cc',
        headerTitleStyle: { color: '#fff' },
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: 'Commandes' }}
      />
      <OrdersStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'Nouvelle commande' }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Commande' }}
      />
      <OrdersStack.Screen
        name="PaymentInit"
        component={PaymentWebViewScreen}
        options={{ title: 'Paiement Mobile Money' }}
      />
    </OrdersStack.Navigator>
  );
}

// ── Cloud stack ──────────────────────────────────────────────────────────────

const CloudStack = createNativeStackNavigator<CloudStackParamList>();

function CloudNavigator() {
  return (
    <CloudStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#16213e' },
        headerTintColor: '#00e5cc',
        headerTitleStyle: { color: '#fff' },
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <CloudStack.Screen
        name="CloudList"
        component={CloudScreen}
        options={{ title: 'Cloud EZVIZ' }}
      />
      <CloudStack.Screen
        name="CloudDetail"
        component={CloudDetailScreen}
        options={{ title: 'Abonnement' }}
      />
      <CloudStack.Screen
        name="CreateSubscription"
        component={CreateSubscriptionScreen}
        options={{ title: 'Nouvel abonnement' }}
      />
    </CloudStack.Navigator>
  );
}

// ── Clients stack ────────────────────────────────────────────────────────────

const ClientsStack = createNativeStackNavigator<ClientsStackParamList>();

function ClientsNavigator() {
  return (
    <ClientsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#16213e' },
        headerTintColor: '#00e5cc',
        headerTitleStyle: { color: '#fff' },
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <ClientsStack.Screen
        name="ClientsList"
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      <ClientsStack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={{ title: 'Fiche client' }}
      />
      <ClientsStack.Screen
        name="CreateClient"
        component={CreateClientScreen}
        options={{ title: 'Nouveau client' }}
      />
      <ClientsStack.Screen
        name="QrScanner"
        component={QrScannerScreen}
        options={{ title: 'Scanner QR', presentation: 'fullScreenModal' }}
      />
    </ClientsStack.Navigator>
  );
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
        component={ClientsNavigator}
        options={{ tabBarLabel: 'Clients', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text> }}
      />
      <Tab.Screen
        name="Cloud"
        component={CloudNavigator}
        options={{ tabBarLabel: 'Cloud', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>☁️</Text> }}
      />
      <Tab.Screen
        name="Commandes"
        component={OrdersNavigator}
        options={{ tabBarLabel: 'Commandes', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛒</Text> }}
      />
      <Tab.Screen
        name="Stock"
        component={StockScreen}
        options={{ tabBarLabel: 'Stock', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text> }}
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
