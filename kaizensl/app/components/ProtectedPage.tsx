import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

type ProtectedPageProps = {
  children: React.ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  return <>{isLoggedIn && children}</>;
}
