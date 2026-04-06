import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";

export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/(auth)/login");
      return;
    }

    // Check driver status to decide where to send them
    const resolve = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!driver) {
        // Step 1 not done — no driver record at all
        router.replace("/(auth)/onboard-vehicle");
        return;
      }

      if (driver.status === "active" || driver.status === "assigned") {
        router.replace("/(app)");
        return;
      }

      // Driver record exists but status is pending —
      // check if they've uploaded vehicle photos yet
      const { count } = await supabase
        .from("wrap_photos")
        .select("id", { count: "exact", head: true })
        .eq("driver_id", driver.id);

      if (!count || count === 0) {
        // Vehicle info saved but photos not uploaded yet
        router.replace("/(auth)/onboard-photos");
      } else {
        // Photos uploaded, genuinely waiting for campaign assignment
        router.replace("/(auth)/pending");
      }
    };

    resolve();
  }, [session, loading, router]);

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
