import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";

export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuthStore();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    // Wait until the Root Layout navigator is fully mounted
    if (!rootNavState?.key) return;
    if (loading) return;

    if (!session) {
      router.replace("/(auth)/login");
      return;
    }

    const resolve = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!driver) {
        router.replace("/(auth)/onboard-vehicle");
        return;
      }

      if (driver.status === "active" || driver.status === "assigned") {
        router.replace("/(app)");
        return;
      }

      const { count } = await supabase
        .from("wrap_photos")
        .select("id", { count: "exact", head: true })
        .eq("driver_id", driver.id);

      if (!count || count === 0) {
        router.replace("/(auth)/onboard-photos");
      } else {
        router.replace("/(auth)/pending");
      }
    };

    resolve();
  }, [rootNavState?.key, session, loading, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F172A",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color="#F97316" size="large" />
    </View>
  );
}
