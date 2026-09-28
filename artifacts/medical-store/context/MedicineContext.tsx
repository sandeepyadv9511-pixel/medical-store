import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type MedicineStatus = 'expired' | 'near' | 'safe';

export interface Medicine {
  id: string;
  name: string;
  mrp: string;
  rate: string;
  expiryDate: string;
  imageUri?: string;
}

interface MedicineContextValue {
  medicines: Medicine[];
  isLoading: boolean;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
}

const MedicineContext = createContext<MedicineContextValue | null>(null);
const STORAGE_KEY = '@medical-store/medicines/v1';

const starterMedicines: Medicine[] = [
  { id: 'starter-1', name: 'Paracetamol 500 mg', mrp: '24.50', rate: '20.00', expiryDate: '2027-03-15' },
  { id: 'starter-2', name: 'Azithromycin 250 mg', mrp: '86.00', rate: '72.00', expiryDate: '2026-10-10' },
  { id: 'starter-3', name: 'Cetirizine 10 mg', mrp: '32.00', rate: '27.00', expiryDate: '2026-08-30' },
  { id: 'starter-4', name: 'ORS Lemon', mrp: '22.00', rate: '18.00', expiryDate: '2027-06-01' },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getMedicineStatus(expiryDate: string): MedicineStatus {
  const expiry = new Date(`${expiryDate}T23:59:59`);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nearExpiry = new Date(todayStart);
  nearExpiry.setDate(nearExpiry.getDate() + 90);

  if (Number.isNaN(expiry.getTime()) || expiry < todayStart) return 'expired';
  if (expiry <= nearExpiry) return 'near';
  return 'safe';
}

export function MedicineProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? (JSON.parse(saved) as Medicine[]) : starterMedicines;
        const normalized = (Array.isArray(parsed) ? parsed : starterMedicines).map((item) => ({
          ...item,
          rate: item.rate ?? item.mrp,
        }));
        if (mounted) setMedicines(normalized);
        if (!saved) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(starterMedicines));
      } catch {
        if (mounted) setMedicines(starterMedicines);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (next: Medicine[]) => {
    setMedicines(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo<MedicineContextValue>(
    () => ({
      medicines,
      isLoading,
      addMedicine: async (medicine) => persist([...medicines, { ...medicine, id: makeId() }]),
      updateMedicine: async (medicine) =>
        persist(medicines.map((item) => (item.id === medicine.id ? medicine : item))),
      deleteMedicine: async (id) => persist(medicines.filter((item) => item.id !== id)),
    }),
    [isLoading, medicines],
  );

  return <MedicineContext.Provider value={value}>{children}</MedicineContext.Provider>;
}

export function useMedicines() {
  const context = useContext(MedicineContext);
  if (!context) throw new Error('useMedicines must be used within MedicineProvider');
  return context;
}