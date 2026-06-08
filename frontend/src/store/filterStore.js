import { create } from 'zustand'

const now = new Date()

export const useFilterStore = create((set) => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  paymentMethod: 'all',
  setYear: (year) => set({ year }),
  setMonth: (month) => set({ month }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
}))
