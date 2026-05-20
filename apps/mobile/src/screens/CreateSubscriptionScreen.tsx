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
import { CloudStackParamList } from '../navigation/AppNavigator';
import { useCreateSubscription } from '../hooks/useCloud';

type Props = NativeStackScreenProps<CloudStackParamList, 'CreateSubscription'>;

const PLAN_OPTIONS = [1, 3, 6, 12, 24] as const;

export default function CreateSubscriptionScreen({ route, navigation }: Props) {
  const { clientId: prefilledClientId = '', clientName: prefilledClientName = '' } = route.params ?? {};

  const [clientId, setClientId] = useState(prefilledClientId);
  const [clientName, setClientName] = useState(prefilledClientName);
  const [serialNumber, setSerialNumber] = useState('');
  const [planMonths, setPlanMonths] = useState<number>(6);
  const [notes, setNotes] = useState('');

  const { mutateAsync: createSub, isPending } = useCreateSubscription();

  async function handleSubmit() {
    if (!clientId.trim()) {
      Alert.alert('Client requis', 'Veuillez entrer l\'ID du client.');
      return;
    }
    if (!serialNumber.trim()) {
      Alert.alert('Numéro de série requis', 'Veuillez entrer le numéro de série de la caméra.');
      return;
    }

    try {
      const sub = await createSub({
        clientId: clientId.trim(),
        serialNumber: serialNumber.trim(),
        planMonths,
        notes: notes.trim() || undefined,
      });
      navigation.replace('CloudDetail', { id: sub.id });
    } catch {
      Alert.alert('Erreur', 'Impossible de créer l\'abonnement. Vérifiez l\'ID client.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>Client *</Text>
        {prefilledClientName ? (
          <View style={styles.prefilledClient}>
            <Text style={styles.prefilledName}>{prefilledClientName}</Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={clientId}
            onChangeText={setClientId}
            placeholder="ID du client (ex: clh3xk...)"
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
        )}
        {!prefilledClientName && (
          <Text style={styles.hint}>Scannez le QR client ou collez l'ID depuis la liste clients</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Numéro de série *</Text>
        <TextInput
          style={styles.input}
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder="Ex: C1234567890"
          placeholderTextColor="#666"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Durée du plan *</Text>
        <View style={styles.planGrid}>
          {PLAN_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.planBtn, planMonths === m && styles.planBtnActive]}
              onPress={() => setPlanMonths(m)}
            >
              <Text style={[styles.planBtnText, planMonths === m && styles.planBtnTextActive]}>
                {m} mois
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes <Text style={styles.optional}>(optionnel)</Text></Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Remarques..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.submit, isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        <Text style={styles.submitText}>
          {isPending ? 'Activation en cours...' : 'Activer l\'abonnement'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  optional: { color: '#666', fontWeight: '400' },
  hint: { color: '#666', fontSize: 11, marginTop: 4 },
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
  multiline: { height: 80, textAlignVertical: 'top' },
  prefilledClient: {
    backgroundColor: '#0a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00e5cc',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prefilledName: { color: '#00e5cc', fontSize: 15, fontWeight: '600' },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planBtn: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  planBtnActive: { borderColor: '#00e5cc', backgroundColor: '#0a2a2a' },
  planBtnText: { color: '#aaa', fontSize: 14 },
  planBtnTextActive: { color: '#00e5cc', fontWeight: '600' },
  submit: { backgroundColor: '#00e5cc', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
