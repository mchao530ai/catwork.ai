import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAdminAuthenticated } from "../../lib/adminAuth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  if (!isAdminAuthenticated()) return null;

  return <>{children}</>;
}
