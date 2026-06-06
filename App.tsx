import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

const lightTheme = {
  bg: '#ffffff',
  text: '#000000',
  button: '#e0e0e0',
  buttonText: '#333',
};

const darkTheme = {
  bg: '#121212',
  text: '#ffc400',
  button: '#333333',
  buttonText: '#fff',
};

export default function App() {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');
  const [text, setText] = useState<string>('Acerca una tarjeta NFC');
  const [status, setStatus] = useState<string>('esperando');

  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    initNfc();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const initNfc = async () => {
    try {
      await NfcManager.start();
      readTag();
    } catch (e) {
      console.warn('NFC init error:', e);
      setStatus('error');
      setText('Error inicializando NFC');
    }
  };

  // Extrae texto legible de NDEF
  const getTextFromTag = (tag: any) => {
    try {
      const message = tag?.ndefMessage?.[0];
      const payload = message?.payload;

      if (!payload) return 'Tarjeta sin contenido';

      // quitar idioma (primeros bytes típicos NDEF)
      const text = String.fromCharCode(...payload.slice(3));

      return text;
    } catch {
      return 'No se pudo leer el contenido';
    }
  };

  const readTag = async () => {
    try {
      setStatus('leyendo');

      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();

      const readableText = getTextFromTag(tag);

      setText(readableText);
      setStatus('leido');

      // 🔊 accesibilidad: anuncia el texto (muy útil para braille/lectores)
      AccessibilityInfo.announceForAccessibility(readableText);

      await NfcManager.cancelTechnologyRequest();

      // pequeña pausa antes de volver a escuchar (evita bugs NFC)
      setTimeout(() => {
        readTag();
      }, 1000);

    } catch (e) {
      console.warn('NFC error:', e);
      setStatus('error');
      setText('Error leyendo NFC. Intenta de nuevo.');

      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.bg}]}>
      <TouchableOpacity
        style={[styles.toggle, {backgroundColor: theme.button}]}
        onPress={() => setIsDark(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
        <Text style={[styles.toggleText, {color: theme.buttonText}]}>
          {isDark ? '☀️' : '🌙'}
        </Text>
      </TouchableOpacity>

      <Text
        style={[styles.text, {color: theme.text}]}
        accessible={true}
        accessibilityLabel={text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },
  toggle: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 22,
  },
  text: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 30,
  },
});