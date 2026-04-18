import { create } from "zustand";

interface UserStore {
  verified: boolean | null; // null = not yet checked
  checking: boolean;
  setVerified: (verified: boolean) => void;
  setChecking: (checking: boolean) => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  verified: null,
  checking: false,
  setVerified: (verified) => set({ verified, checking: false }),
  setChecking: (checking) => set({ checking }),
  reset: () => set({ verified: null, checking: false }),
}));
