import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  // const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // signOut();

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
