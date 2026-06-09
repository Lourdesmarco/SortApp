import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import Svg, {Path} from 'react-native-svg';

export interface Group {
  id: string;
  name: string;
  cards: string[];
}

interface Props {
  theme: {
    bg: string;
    text: string;
    button: string;
    buttonText: string;
    buttonPrimary: string;
    buttonTextPrimary: string;
  };
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  onClose: () => void;
}

const getTextFromTag = (tag: any) => {
  try {
    const message = tag?.ndefMessage?.[0];
    const payload = message?.payload;
    if (!payload) return 'Esa tarjeta no es válida';
    const text = String.fromCharCode(...payload.slice(3));
    return text;
  } catch {
    return 'No se pudo leer el contenido';
  }
};

export default function GroupManager({theme, groups, setGroups, onClose}: Props) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [statusText, setStatusText] = useState('');
  const isReadingRef = useRef(false);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const readTag = async () => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      const readableText = getTextFromTag(tag);

      const group = groups.find(g => g.id === selectedGroupId);
      if (group?.cards.includes(readableText)) {
        setStatusText('Esa tarjeta ya ha sido añadida');
        AccessibilityInfo.announceForAccessibility('Esa tarjeta ya ha sido añadida');
      } else {
        const updatedGroups = groups.map(g => {
          if (g.id === selectedGroupId) {
            return {...g, cards: [...g.cards, readableText]};
          }
          return g;
        });
        setGroups(updatedGroups);

        setStatusText(`Añadida: ${readableText}`);
        AccessibilityInfo.announceForAccessibility('Tarjeta añadida');
      }

      await NfcManager.cancelTechnologyRequest();

      if (isReadingRef.current) {
        setTimeout(() => readTag(), 1000);
      }
    } catch (e) {
      console.warn('NFC error:', e);
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
      if (isReadingRef.current) {
        setTimeout(() => readTag(), 1000);
      }
    }
  };

  const startReading = async () => {
    setIsAddingCard(true);
    setStatusText('Acerca una tarjeta NFC');
    isReadingRef.current = true;
    readTag();
  };

  const stopReading = () => {
    isReadingRef.current = false;
    setIsAddingCard(false);
    setStatusText('');
    NfcManager.cancelTechnologyRequest().catch(() => {});
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      cards: [],
    };
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setIsCreating(false);
  };

  const handleSelectGroup = (id: string) => {
    setSelectedGroupId(id);
    setView('detail');
  };

  const handleDeleteCard = (index: number) => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro de que quieres eliminar esta tarjeta?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedGroups = groups.map(g => {
              if (g.id === selectedGroupId) {
                const newCards = g.cards.filter((_, i) => i !== index);
                return {...g, cards: newCards};
              }
              return g;
            });
            setGroups(updatedGroups);
          },
        },
      ],
    );
  };

  const handleBackToList = () => {
    if (isAddingCard) stopReading();
    setSelectedGroupId(null);
    setView('list');
  };

  useEffect(() => {
    return () => {
      isReadingRef.current = false;
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  if (view === 'detail' && selectedGroup) {
    return (
      <View style={styles.overlay}>
        <View style={[styles.container, {backgroundColor: theme.bg}]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBackToList}
              accessibilityRole="button"
              accessibilityLabel="Volver a lista de grupos">
              <Svg viewBox="0 0 24 24" width={22} height={22}>
                <Path
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  stroke={theme.text}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={[styles.title, {color: theme.text}]} numberOfLines={1}>
              {selectedGroup.name}
            </Text>
            <TouchableOpacity
              onPress={onClose}
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
          </View>

          <FlatList
            data={selectedGroup.cards}
            keyExtractor={(item, index) => `${item}-${index}`}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, {color: theme.text}]}>
                {isAddingCard ? statusText : 'Este grupo no tiene tarjetas'}
              </Text>
            }
            renderItem={({item, index}) => (
              <View style={[styles.itemRow, {borderColor: theme.text}]}>
                <Text style={[styles.itemIndex, {color: theme.text}]}>{index + 1}</Text>
                <Text style={[styles.itemText, {color: theme.text}]} numberOfLines={2}>
                  {item}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteCard(index)}
                  style={styles.deleteButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar tarjeta ${index + 1}`}>
                  <Svg viewBox="0 0 24 24" width={18} height={18}>
                    <Path
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      stroke={theme.text}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            )}
          />

          {isAddingCard ? (
            <TouchableOpacity
              style={[styles.bottomButton, {backgroundColor: theme.button}]}
              onPress={stopReading}
              accessibilityRole="button"
              accessibilityLabel="Detener lectura">
              <Text style={[styles.buttonText, {color: theme.buttonText}]}>
                Detener lectura
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.bottomButton, {backgroundColor: theme.buttonPrimary}]}
              onPress={startReading}
              accessibilityRole="button"
              accessibilityLabel="Añadir tarjeta NFC">
              <Text style={[styles.buttonText, {color: theme.buttonTextPrimary}]}>
                Añadir tarjeta
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, {backgroundColor: theme.bg}]}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.text}]}>Grupos</Text>
          <TouchableOpacity
            onPress={onClose}
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
        </View>

        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, {color: theme.text}]}>
              No hay grupos creados
            </Text>
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.groupItem, {borderColor: theme.text}]}
              onPress={() => handleSelectGroup(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.cards.length} tarjetas`}>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, {color: theme.text}]}>{item.name}</Text>
                <Text style={[styles.groupCount, {color: theme.text}]}>
                  {item.cards.length} tarjetas
                </Text>
              </View>
              <Svg viewBox="0 0 24 24" width={20} height={20}>
                <Path
                  d="M8.25 4.5 15.75 12l-7.5 7.5"
                  stroke={theme.text}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
          )}
        />

        {isCreating ? (
          <View style={styles.createArea}>
            <TextInput
              style={[styles.input, {color: theme.text, borderColor: theme.text}]}
              placeholder="Nombre del grupo"
              placeholderTextColor="#999"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.createButtons}>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: theme.buttonPrimary}]}
                onPress={handleCreateGroup}
                accessibilityRole="button"
                accessibilityLabel="Crear grupo">
                <Text style={[styles.buttonLabel, {color: theme.buttonTextPrimary}]}>
                  Crear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: theme.button}]}
                onPress={() => {
                  setIsCreating(false);
                  setNewGroupName('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancelar">
                <Text style={[styles.buttonLabel, {color: theme.buttonText}]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.bottomButton, {backgroundColor: theme.buttonPrimary}]}
            onPress={() => setIsCreating(true)}
            accessibilityRole="button"
            accessibilityLabel="Crear nuevo grupo">
            <Text style={[styles.buttonText, {color: theme.buttonTextPrimary}]}>
              Crear grupo
            </Text>
          </TouchableOpacity>
        )}
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
  container: {
    width: '90%',
    maxHeight: '85%',
    padding: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.7,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  groupCount: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itemIndex: {
    fontSize: 14,
    fontWeight: '600',
    width: 28,
  },
  itemText: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createArea: {
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingTop: 16,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  createButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
