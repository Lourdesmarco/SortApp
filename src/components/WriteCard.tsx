import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';
import Svg, {Path} from 'react-native-svg';

interface Props {
  theme: {bg: string; text: string; button: string; buttonText: string; buttonPrimary: string; buttonTextPrimary: string;};
  onCancel: () => void;
}

export default function WriteCard({theme, onCancel}: Props) {
  const [inputText, setInputText] = useState('');

  const handleSave = async () => {
    if (!inputText.trim()) {
      return;
    }

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const bytes = Ndef.encodeMessage([Ndef.textRecord(inputText.trim())]);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      AccessibilityInfo.announceForAccessibility('Escritura exitosa');
      await NfcManager.cancelTechnologyRequest();
      onCancel();
    } catch (e) {
      console.warn('NFC write error:', e);
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  };

  return (
    <View style={[styles.overlay]}>
      <View style={[styles.card, {backgroundColor: theme.bg}]}>
        <Text style={[styles.title, {color: theme.text}]}>
          Escribir tarjeta NFC
        </Text>

        <TextInput
          style={[styles.input, {color: theme.text, borderColor: theme.text}]}
          placeholder="Escribe el texto para la tarjeta"
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          autoFocus
        />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cerrar">
          <Svg viewBox="0 0 24 24" width={22} height={22}>
            <Path
              d="M6 18 18 6M6 6l12 12"
              stroke={theme.text}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: theme.buttonPrimary}]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Guardar">
            <Text style={[styles.buttonText, {color: theme.buttonTextPrimary}]}>
              Guardar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    minHeight: 40,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
