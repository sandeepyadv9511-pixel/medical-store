import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Medicine, getMedicineStatus, useMedicines } from '@/context/MedicineContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EditorMode = 'new' | Medicine | null;

const statusCopy = {
  expired: { label: 'Expired', icon: 'alert-circle-outline' as const },
  near: { label: 'Near Expiry', icon: 'clock-alert-outline' as const },
  safe: { label: 'Safe', icon: 'check-circle-outline' as const },
};

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusPill({ expiryDate }: { expiryDate: string }) {
  const colors = useColors();
  const status = getMedicineStatus(expiryDate);
  const palette = {
    expired: { background: '#FDEBEC', text: colors.destructive },
    near: { background: '#FFF4D9', text: '#A66B00' },
    safe: { background: '#E4F5EE', text: '#257B60' },
  }[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: palette.background }]}>
      <MaterialCommunityIcons name={statusCopy[status].icon} size={14} color={palette.text} />
      <Text style={[styles.statusText, { color: palette.text }]}>{statusCopy[status].label}</Text>
    </View>
  );
}

function MedicineArtwork({ imageUri, compact = false }: { imageUri?: string; compact?: boolean }) {
  const colors = useColors();
  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[styles.medicineImage, compact && styles.medicineImageCompact]} />;
  }
  return (
    <View
      style={[
        styles.medicineArtwork,
        compact && styles.medicineArtworkCompact,
        { backgroundColor: colors.secondary },
      ]}
    >
      <MaterialCommunityIcons name="pill" size={compact ? 24 : 32} color={colors.primary} />
    </View>
  );
}

function MedicineCard({ item, onPress }: { item: Medicine; onPress: () => void }) {
  const colors = useColors();
  const status = getMedicineStatus(item.expiryDate);
  const borderColor = status === 'expired' ? '#F2C9CC' : status === 'near' ? '#F1D694' : colors.border;

  return (
    <Pressable
      testID={`medicine-card-${item.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.medicineCard,
        { backgroundColor: colors.card, borderColor },
        pressed && styles.pressed,
      ]}
    >
      <MedicineArtwork imageUri={item.imageUri} />
      <View style={styles.cardInfo}>
        <Text style={[styles.medicineName, { color: colors.foreground }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>MRP</Text>
        <Text style={[styles.mrp, { color: colors.foreground }]}>₹{item.mrp}</Text>
        <View style={styles.expiryRow}>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.expiryDate, { color: colors.mutedForeground }]}>
            {formatDate(item.expiryDate)}
          </Text>
        </View>
      </View>
      <View style={styles.cardSide}>
        <StatusPill expiryDate={item.expiryDate} />
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

function DetailModal({
  medicine,
  onClose,
  onEdit,
  onDelete,
}: {
  medicine: Medicine | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  if (!medicine) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(14, 37, 34, 0.44)' }]}>
        <View style={[styles.detailSheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Medicine Details</Text>
            <Pressable testID="close-details" onPress={onClose} style={styles.iconButton}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.detailHero}>
            <MedicineArtwork imageUri={medicine.imageUri} />
            <View style={styles.detailHeroCopy}>
              <Text style={[styles.detailName, { color: colors.foreground }]}>{medicine.name}</Text>
              <StatusPill expiryDate={medicine.expiryDate} />
            </View>
          </View>
          <View style={[styles.detailGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailCell}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>MRP</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>₹{medicine.mrp}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Expiry Date</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{formatDate(medicine.expiryDate)}</Text>
            </View>
          </View>
          <View style={styles.detailActions}>
            <Pressable
              testID="edit-medicine"
              onPress={onEdit}
              style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Feather name="edit-2" size={18} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Edit</Text>
            </Pressable>
            <Pressable
              testID="delete-medicine"
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteButton, { backgroundColor: '#FDEBEC' }, pressed && styles.pressed]}
            >
              <Feather name="trash-2" size={18} color={colors.destructive} />
              <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MedicineFormModal({
  editor,
  onClose,
  onSaved,
}: {
  editor: EditorMode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const colors = useColors();
  const { addMedicine, updateMedicine } = useMedicines();
  const isEditing = editor !== null && editor !== 'new';
  const medicine = isEditing ? editor : null;
  const [name, setName] = useState('');
  const [mrp, setMrp] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (editor === null) return;
    setName(medicine?.name ?? '');
    setMrp(medicine?.mrp ?? '');
    setExpiryDate(medicine?.expiryDate ?? '');
    setImageUri(medicine?.imageUri);
    setError('');
  }, [editor, medicine?.expiryDate, medicine?.id, medicine?.imageUri, medicine?.mrp, medicine?.name]);

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri);
      await Haptics.selectionAsync();
    }
  };

  const save = async () => {
    const parsedMrp = Number(mrp);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(expiryDate) && !Number.isNaN(new Date(`${expiryDate}T12:00:00`).getTime());
    if (!name.trim()) return setError('Medicine Name डालें');
    if (!mrp.trim() || Number.isNaN(parsedMrp) || parsedMrp <= 0) return setError('सही MRP डालें');
    if (!validDate) return setError('Expiry Date YYYY-MM-DD में डालें');

    const data = { name: name.trim(), mrp: parsedMrp.toFixed(2), expiryDate, imageUri };
    if (medicine) await updateMedicine({ ...medicine, ...data });
    else await addMedicine(data);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
  };

  if (editor === null) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(14, 37, 34, 0.44)' }]}>
        <View style={[styles.formSheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {medicine ? 'Edit Medicine' : 'Add Medicine'}
            </Text>
            <Pressable testID="close-form" onPress={onClose} style={styles.iconButton}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={{ paddingBottom: 36 }}
            bottomOffset={24}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable testID="choose-medicine-image" onPress={chooseImage} style={styles.imagePicker}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.formImage} />
              ) : (
                <>
                  <View style={[styles.imagePickerIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="camera" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.imagePickerTitle, { color: colors.foreground }]}>Medicine Image</Text>
                  <Text style={[styles.imagePickerHint, { color: colors.mutedForeground }]}>Gallery से photo चुनें</Text>
                </>
              )}
            </Pressable>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Medicine Name</Text>
            <TextInput
              testID="medicine-name-input"
              value={name}
              onChangeText={setName}
              placeholder="जैसे Paracetamol 500 mg"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }]}
              autoCapitalize="sentences"
            />
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>MRP</Text>
            <View style={styles.rupeeInput}>
              <Text style={[styles.rupeeSymbol, { color: colors.mutedForeground }]}>₹</Text>
              <TextInput
                testID="medicine-mrp-input"
                value={mrp}
                onChangeText={setMrp}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.input, styles.rupeeTextInput, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }]}
              />
            </View>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Expiry Date</Text>
            <View style={styles.dateInputWrap}>
              <TextInput
                testID="medicine-expiry-input"
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                style={[styles.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }]}
                maxLength={10}
              />
              <Feather name="calendar" size={19} color={colors.mutedForeground} style={styles.dateIcon} />
            </View>
            {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
            <Pressable
              testID="save-medicine"
              onPress={save}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
            >
              <Feather name="check" size={19} color={colors.primaryForeground} />
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Save Medicine</Text>
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { medicines, isLoading, deleteMedicine } = useMedicines();
  const searchRef = useRef<TextInput>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [editor, setEditor] = useState<EditorMode>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => searchRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  const filteredMedicines = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return medicines;
    return medicines.filter((item) => item.name.toLocaleLowerCase().includes(search));
  }, [medicines, query]);

  const counts = useMemo(
    () => ({
      expired: medicines.filter((item) => getMedicineStatus(item.expiryDate) === 'expired').length,
      near: medicines.filter((item) => getMedicineStatus(item.expiryDate) === 'near').length,
    }),
    [medicines],
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    Keyboard.dismiss();
  };

  const confirmDelete = (medicine: Medicine) => {
    Alert.alert('Delete Medicine?', `${medicine.name} को हटाना है?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedicine(medicine.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSelectedMedicine(null);
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.topArea, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandRow}>
              <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="plus" size={20} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.brand, { color: colors.foreground }]}>Medical Store</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>दवाओं का आसान प्रबंधन</Text>
          </View>
          <Pressable
            testID="open-search"
            onPress={() => {
              setSearchOpen(true);
              void Haptics.selectionAsync();
            }}
            style={({ pressed }) => [styles.searchButton, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <Feather name="search" size={21} color={colors.foreground} />
          </Pressable>
        </View>
        {searchOpen ? (
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Feather name="search" size={19} color={colors.primary} />
            <TextInput
              ref={searchRef}
              testID="medicine-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder="दवा का नाम खोजें"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              autoCorrect={false}
              returnKeyType="search"
            />
            <Pressable testID="close-search" onPress={closeSearch} style={styles.searchClose}>
              <Feather name="x" size={19} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <FlatList
        data={filteredMedicines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MedicineCard
            item={item}
            onPress={() => {
              setSelectedMedicine(item);
              void Haptics.selectionAsync();
            }}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 18) + 88 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={filteredMedicines.length > 0}
        ListHeaderComponent={
          <View>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryEyebrow}>INVENTORY OVERVIEW</Text>
                <Text style={styles.summaryTitle}>{medicines.length} Medicines</Text>
                <Text style={styles.summaryHint}>अपना stock हमेशा control में रखें</Text>
              </View>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons name="medical-bag" size={36} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Medicines</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                  {counts.expired > 0 ? `${counts.expired} expired` : 'कोई expired दवा नहीं'}
                  {counts.near > 0 ? `  •  ${counts.near} near expiry` : ''}
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#257B60' }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Safe</Text>
              </View>
            </View>
            {searchOpen && query ? (
              <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
                {filteredMedicines.length} result{filteredMedicines.length === 1 ? '' : 's'}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name={query ? 'magnify-close' : 'pill'} size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {query ? 'कोई दवा नहीं मिली' : 'अभी कोई दवा नहीं है'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {query ? 'दवा का नाम दोबारा जाँचें' : 'पहली medicine जोड़कर शुरुआत करें'}
            </Text>
          </View>
        }
      />

      <View style={[styles.addBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 16), backgroundColor: colors.background }]}>
        <Pressable
          testID="add-medicine"
          onPress={() => setEditor('new')}
          style={({ pressed }) => [styles.primaryButton, styles.addButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Feather name="plus" size={21} color={colors.primaryForeground} />
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Add Medicine</Text>
        </Pressable>
      </View>

      <DetailModal
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        onEdit={() => {
          if (selectedMedicine) {
            setEditor(selectedMedicine);
            setSelectedMedicine(null);
          }
        }}
        onDelete={() => selectedMedicine && confirmDelete(selectedMedicine)}
      />
      <MedicineFormModal editor={editor} onClose={() => setEditor(null)} onSaved={() => setEditor(null)} />
      {isLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="medical-bag" size={30} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Medicines लोड हो रही हैं...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topArea: { paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 23, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 5, marginLeft: 43 },
  searchButton: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  searchBox: { height: 52, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 18 },
  searchInput: { flex: 1, fontSize: 16, paddingHorizontal: 10, paddingVertical: 0 },
  searchClose: { padding: 4 },
  listContent: { paddingHorizontal: 20 },
  summaryCard: { minHeight: 125, borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  summaryCopy: { flex: 1 },
  summaryEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  summaryTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', marginTop: 6, letterSpacing: -0.4 },
  summaryHint: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 5 },
  summaryIcon: { width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, marginTop: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 12 },
  resultText: { fontSize: 12, marginBottom: 10 },
  medicineCard: { minHeight: 110, borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  medicineArtwork: { width: 78, height: 84, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  medicineArtworkCompact: { width: 78, height: 84 },
  medicineImage: { width: 78, height: 84, borderRadius: 15, resizeMode: 'cover' },
  medicineImageCompact: { width: 78, height: 84 },
  cardInfo: { flex: 1, minWidth: 0, paddingHorizontal: 12 },
  medicineName: { fontSize: 16, fontWeight: '600', lineHeight: 21 },
  cardLabel: { fontSize: 10, marginTop: 7, textTransform: 'uppercase', letterSpacing: 0.7 },
  mrp: { fontSize: 16, fontWeight: '700', marginTop: 1 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  expiryDate: { fontSize: 11 },
  cardSide: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 46, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 15 },
  emptyText: { fontSize: 13, marginTop: 5, textAlign: 'center' },
  addBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12 },
  addButton: { marginBottom: 0 },
  primaryButton: { minHeight: 54, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 20 },
  primaryButtonText: { fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  detailSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  formSheet: { maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 3, backgroundColor: '#C4D4D0', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  iconButton: { padding: 5 },
  detailHero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  detailHeroCopy: { flex: 1, gap: 10 },
  detailName: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  detailGrid: { borderWidth: 1, borderRadius: 18, flexDirection: 'row', marginBottom: 20 },
  detailCell: { flex: 1, padding: 16 },
  detailLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7 },
  detailValue: { fontSize: 17, fontWeight: '700', marginTop: 7 },
  detailActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButtonText: { fontSize: 15, fontWeight: '700' },
  deleteButton: { flex: 1, minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteButtonText: { fontSize: 15, fontWeight: '700' },
  imagePicker: { minHeight: 130, borderRadius: 18, borderWidth: 1, borderColor: '#D5E5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  imagePickerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  imagePickerTitle: { fontSize: 14, fontWeight: '600' },
  imagePickerHint: { fontSize: 12, marginTop: 4 },
  formImage: { width: '100%', height: 160, resizeMode: 'cover' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 15, marginBottom: 16 },
  rupeeInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rupeeSymbol: { position: 'absolute', left: 16, zIndex: 1, fontSize: 16 },
  rupeeTextInput: { flex: 1, marginBottom: 0, paddingLeft: 34 },
  dateInputWrap: { position: 'relative' },
  dateIcon: { position: 'absolute', right: 16, top: 16 },
  errorText: { fontSize: 13, marginTop: -5, marginBottom: 12 },
  loadingOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14 },
});