import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiClient, setClientAccessToken } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart-store";
import type { UserAddress } from "@e-com/shared/schemas";
import type { userLoginInput, userRegistrationInput } from "@e-com/shared/schemas";

export interface AuthUserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string | null;
  role: string;
  permissions?: string[];
  addresses: UserAddress[];
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: AuthUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: AuthUserProfile | null) => void;
  setAddresses: (addresses: UserAddress[]) => void;
  checkAuth: () => Promise<void>;
  login: (input: userLoginInput) => Promise<AuthUserProfile>;
  register: (input: userRegistrationInput) => Promise<AuthUserProfile>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstname?: string; lastname?: string; phone?: string }) => Promise<void>;
  addAddress: (address: UserAddress) => Promise<UserAddress[]>;
  updateAddresses: (addresses: UserAddress[]) => Promise<UserAddress[]>;
  deleteAddress: (addressId: string) => Promise<UserAddress[]>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: Boolean(user),
          isLoading: false,
          isInitialized: true,
        });
      },

      setAddresses: (addresses) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, addresses },
          });
        }
      },

      /**
       * Silently verifies existing session on app mount.
       * Calls refresh endpoint first via credentials cookie; if valid, fetches full profile.
       */
      checkAuth: async () => {
        try {
          // Attempt silent token refresh via HTTP-only cookie
          const refreshRes = await apiClient.post(
            "/api/auth/refresh",
            {},
            { skipAuth: true }
          ).catch(() => null);

          if (refreshRes?.success && refreshRes?.data?.accessToken) {
            setClientAccessToken(refreshRes.data.accessToken);

            // Fetch full profile with addresses
            const profileRes = await apiClient.get<{ success: boolean; data: AuthUserProfile }>("/api/users/me");
            if (profileRes.success && profileRes.data) {
              set({
                user: profileRes.data,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              });

              // Sync cart with backend asynchronously
              useCartStore.getState().syncCartWithBackend().catch(() => {});
              return;
            }
          }

          // No active or valid session
          setClientAccessToken(null);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("vv_auth_session");
            } catch {}
          }
        } catch (error) {
          setClientAccessToken(null);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("vv_auth_session");
            } catch {}
          }
        }
      },

      login: async (input: userLoginInput) => {
        try {
          set({ isLoading: true });
          const res = await apiClient.post<{
            success: boolean;
            data: {
              accessToken: string;
              user: {
                email: string;
                firstname: string;
                lastname: string;
                role: string;
                permissions: string[];
              };
            };
          }>("/api/auth/login", input, { skipAuth: true });

          if (!res.success || !res.data) {
            throw new Error("Login failed");
          }

          setClientAccessToken(res.data.accessToken);

          // Now fetch complete user profile including addresses
          const profileRes = await apiClient.get<{ success: boolean; data: AuthUserProfile }>("/api/users/me");
          const fullUser: AuthUserProfile = profileRes.data || {
            id: "",
            email: res.data.user.email,
            firstname: res.data.user.firstname,
            lastname: res.data.user.lastname,
            phone: null,
            role: res.data.user.role,
            permissions: res.data.user.permissions,
            addresses: [],
            isEmailVerified: false,
          };

          set({
            user: fullUser,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });

          // Guest to User Cart Sync on Login
          try {
            await useCartStore.getState().syncCartWithBackend();
          } catch (syncErr) {
            console.warn("[Auth Store] Cart sync warning on login:", syncErr);
          }

          return fullUser;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (input: userRegistrationInput) => {
        try {
          set({ isLoading: true });
          const res = await apiClient.post<{
            success: boolean;
            data: {
              accessToken: string;
              user: {
                email: string;
                firstname: string;
                lastname: string;
                role: string;
                permissions: string[];
              };
            };
          }>("/api/auth/register", input, { skipAuth: true });

          if (!res.success || !res.data) {
            throw new Error("Registration failed");
          }

          setClientAccessToken(res.data.accessToken);

          // Fetch full profile including addresses
          const profileRes = await apiClient.get<{ success: boolean; data: AuthUserProfile }>("/api/users/me");
          const fullUser: AuthUserProfile = profileRes.data || {
            id: "",
            email: res.data.user.email,
            firstname: res.data.user.firstname,
            lastname: res.data.user.lastname,
            phone: null,
            role: res.data.user.role,
            permissions: res.data.user.permissions,
            addresses: [],
            isEmailVerified: false,
          };

          set({
            user: fullUser,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });

          // Guest to User Cart Sync on Login
          try {
            await useCartStore.getState().syncCartWithBackend();
          } catch (syncErr) {
            console.warn("[Auth Store] Cart sync warning on login:", syncErr);
          }

          return fullUser;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await apiClient.post("/api/auth/logout", {}).catch(() => null);
        } finally {
          setClientAccessToken(null);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("vv_auth_session");
            } catch {}
          }
        }
      },

      updateProfile: async (data) => {
        const res = await apiClient.put<{ success: boolean; data: Partial<AuthUserProfile> }>("/api/users/me", data);
        if (res.success && res.data) {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                ...res.data,
              },
            });
          }
        }
      },

      addAddress: async (address: UserAddress) => {
        const res = await apiClient.post<{ success: boolean; data: UserAddress[] }>("/api/users/me/addresses", address);
        if (res.success && Array.isArray(res.data)) {
          get().setAddresses(res.data);
          return res.data;
        }
        return get().user?.addresses || [];
      },

      updateAddresses: async (addresses: UserAddress[]) => {
        const res = await apiClient.put<{ success: boolean; data: UserAddress[] }>("/api/users/me/addresses", {
          addresses,
        });
        if (res.success && Array.isArray(res.data)) {
          get().setAddresses(res.data);
          return res.data;
        }
        return get().user?.addresses || [];
      },

      deleteAddress: async (addressId: string) => {
        const res = await apiClient.delete<{ success: boolean; data: UserAddress[] }>(
          `/api/users/me/addresses/${addressId}`
        );
        if (res.success && Array.isArray(res.data)) {
          get().setAddresses(res.data);
          return res.data;
        }
        return get().user?.addresses || [];
      },
    }),
    {
      name: "vv_auth_session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
