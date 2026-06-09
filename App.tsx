import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import WriteCard from './src/components/WriteCard';
import Svg, {Path} from 'react-native-svg';

const lightTheme = {
  bg: '#ffffff',
  text: '#000000',
  button: '#333333',  
  buttonText: '#fff',
  buttonPrimary: '#ffc400',
  buttonTextPrimary: '#333333',
};

const darkTheme = {
  bg: '#121212',
  text: '#ffc400',
  button: '#333333', 
  buttonText: '#fff',
  buttonPrimary: '#ffc400',
  buttonTextPrimary: '#333333',
};

export default function App() {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');
  const [text, setText] = useState<string>('Acerca una tarjeta NFC');
  const [status, setStatus] = useState<string>('esperando');
  const [showWriteCard, setShowWriteCard] = useState(false);
  const isReadingRef = useRef(true);

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

      if (!payload) return 'Esa tarjeta no es válida';

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

      AccessibilityInfo.announceForAccessibility(readableText);

      await NfcManager.cancelTechnologyRequest();

      if (isReadingRef.current) {
        setTimeout(() => {
          readTag();
        }, 1000);
      }

    } catch (e) {
      console.warn('NFC error:', e);
      setStatus('error');
      setText('Error leyendo NFC. Intenta de nuevo.');

      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}

      if (isReadingRef.current) {
        setTimeout(() => {
          readTag();
        }, 1000);
      }
    }
  };

  const handleOpenWrite = () => {
    isReadingRef.current = false;
    setShowWriteCard(true);
  };

  const handleCloseWrite = () => {
    setShowWriteCard(false);
    isReadingRef.current = true;
    setTimeout(() => {
      readTag();
    }, 500);
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.bg}]}>
      <TouchableOpacity
        style={[styles.toggle, {backgroundColor: theme.button}]}
        onPress={() => setIsDark(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
        {isDark ? (
          <Svg viewBox="0 0 24 24" width={22} height={22}>
            <Path
              d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              stroke={theme.buttonText}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        ) : (
          <Svg viewBox="0 0 24 24" width={22} height={22}>
            <Path
              d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              stroke={theme.buttonText}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pencil, {backgroundColor: theme.button}]}
        onPress={handleOpenWrite}
        accessibilityRole="button"
        accessibilityLabel="Escribir tarjeta NFC">
        <Svg viewBox="0 0 24 24" width={22} height={22}>
          <Path
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            stroke={theme.buttonText}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </TouchableOpacity>

      <Text
        style={[styles.text, {color: theme.text}]}
        accessible={true}
        accessibilityLabel={text}>
        {text}
      </Text>

      {showWriteCard && (
        <WriteCard theme={theme} onCancel={handleCloseWrite} />
      )}
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
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencil: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 30,
  },
});