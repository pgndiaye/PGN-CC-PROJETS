import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLogin } from '../hooks/useAuth';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  const handleLogin = () => {
    if (!email.trim() || !password) return;
    login(
      { email: email.trim(), password },
      { onSuccess: () => navigation.replace('Main') },
    );
  };

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Identifiants incorrects.' : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>EZVIZ</Text>
        <Text style={styles.subtitle}>Sénégal — Espace Pro</Text>

        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          editable={!isPending}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#666"
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          editable={!isPending}
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logo: { fontSize: 40, fontWeight: '900', color: '#00e5cc', textAlign: 'center', letterSpacing: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 48, marginTop: 4 },
  input: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 14,
  },
  error: { color: '#ff6b6b', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  button: {
    backgroundColor: '#00e5cc',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '700' },
});
