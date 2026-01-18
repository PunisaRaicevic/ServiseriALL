import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  userRole?: string; // super_admin | org_admin | technician
  organizationId?: string;
  organizationName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user/me"],
    retry: false,
    refetchOnMount: true,  // Always refetch to get fresh user data
    refetchOnWindowFocus: false,
    staleTime: 30000,  // Consider data fresh for 30 seconds
  });

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
