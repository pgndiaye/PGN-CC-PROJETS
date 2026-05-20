import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientsStackParamList } from '../navigation/AppNavigator';
import { CreateClientInput, useCreateClient } from '../hooks/useClients';

type Props = NativeStackScreenProps<ClientsStackParamList, 'CreateClient'>;

export default function CreateClientScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'PARTICULIER' | 'ENTREPRISE'>('PARTICULIER');

  const { mutateAsync: createClient, isPending } = useCreateClient();

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Nom, téléphone et ville sont obligatoires.');
      return;
    }

    const input: CreateClientInput = {
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      type,
    };

    if (address.trim()) {
      input.address = address.trim();
    }

    try {
      const client = await createClient(input);
      navigation.replace('ClientDetail', { id: client.id });
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le client. Vérifiez votre connexion.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Nom *" value={name} onChangeText={setName} placeholder="Nom complet" />
      <Field label="Téléphone *" value={phone} onChangeText={setPhone} placeholder="7X XXX XX XX" keyboardType="phone-pad" />
      <Field label="Ville *" value={city} onChangeText={setCity} placeholder="Dakar" />
      <Field label="Adresse" value={address} onChangeText={setAddress} placeholder="Rue, quartier..." optional />

      <Text style={styles.label}>Type de client</Text>
      <View style={styles.typeRow}>
        {(['PARTICULIER', 'ENTREPRISE'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, type === t && styles.typeBtnActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
              {t === 'PARTICULIER' ? '👤 Particulier' : '🏢 Entreprise'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submit, isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        <Text style={styles.submitText}>
          {isPending ? 'Création en cours...' : 'Créer le client'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  optional?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', optional }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> (optionnel)</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  optional: { color: '#666', fontWeight: '400' },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  typeBtnActive: { borderColor: '#00e5cc', backgroundColor: '#0a2a2a' },
  typeBtnText: { color: '#aaa', fontSize: 14 },
  typeBtnTextActive: { color: '#00e5cc', fontWeight: '600' },
  submit: {
    backgroundColor: '#00e5cc',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
