import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import type { WrapAngle } from "@wrapped/shared";

type PhotoSlot = {
  angle: WrapAngle;
  label: string;
  uri: string | null;
};

const INITIAL_SLOTS: PhotoSlot[] = [
  { angle: "front", label: "Front", uri: null },
  { angle: "side", label: "Side", uri: null },
  { angle: "rear", label: "Rear", uri: null },
];

export default function OnboardPhotosScreen() {
  const router = useRouter();
  const [slots, setSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async (angle: WrapAngle) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload vehicle photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSlots((prev) =>
        prev.map((s) =>
          s.angle === angle ? { ...s, uri: result.assets[0].uri } : s,
        ),
      );
    }
  };

  const uploadPhoto = async (
    uri: string,
    driverId: string,
    angle: WrapAngle,
  ): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split(".").pop() ?? "jpg";
    const path = `${driverId}/${angle}.${ext}`;

    const { error } = await supabase.storage
      .from("wrap-photos")
      .upload(path, blob, { contentType: `image/${ext}` });

    if (error) throw error;

    const { data } = supabase.storage.from("wrap-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async () => {
    const filled = slots.filter((s) => s.uri !== null);
    if (filled.length < 2) {
      Alert.alert("Add photos", "Please upload at least 2 vehicle photos.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    // Get the driver record
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (driverError || !driver) {
      Alert.alert(
        "Error",
        "Driver record not found. Please restart onboarding.",
      );
      setLoading(false);
      return;
    }

    try {
      for (const slot of filled) {
        const url = await uploadPhoto(slot.uri!, driver.id, slot.angle);
        const { error: insertError } = await supabase
          .from("wrap_photos")
          .insert({
            driver_id: driver.id,
            photo_url: url,
            angle: slot.angle,
          });
        if (insertError) throw insertError;
      }
      router.replace("/(auth)/pending");
    } catch (e: any) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const allFilled = slots.every((s) => s.uri !== null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Photos</Text>
        <Text style={styles.subtitle}>
          Step 3 of 3 — Upload at least 2 photos
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      <Text style={styles.hint}>
        Take clear photos of your vehicle. Our team uses these to assess your
        car before assigning a wrap.
      </Text>

      {/* Photo slots */}
      <View style={styles.slots}>
        {slots.map(({ angle, label, uri }) => (
          <TouchableOpacity
            key={angle}
            style={[styles.slot, uri && styles.slotFilled]}
            onPress={() => pickPhoto(angle)}
            activeOpacity={0.8}
          >
            {uri ? (
              <>
                <Image source={{ uri }} style={styles.preview} />
                <View style={styles.slotOverlay}>
                  <Text style={styles.slotOverlayText}>✓ {label}</Text>
                </View>
              </>
            ) : (
              <View style={styles.slotEmpty}>
                <Text style={styles.slotIcon}>📷</Text>
                <Text style={styles.slotLabel}>{label}</Text>
                <Text style={styles.slotCta}>Tap to add</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.button,
          (loading || slots.filter((s) => s.uri).length < 2) &&
            styles.buttonDisabled,
        ]}
        onPress={onSubmit}
        disabled={loading || slots.filter((s) => s.uri).length < 2}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Application</Text>
        )}
      </TouchableOpacity>

      {!allFilled && (
        <Text style={styles.skipHint}>At least 2 photos required</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  inner: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#1E293B",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 2,
  },
  hint: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  slots: {
    gap: 12,
    marginBottom: 32,
  },
  slot: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#334155",
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: "#1E293B",
  },
  slotFilled: {
    borderStyle: "solid",
    borderColor: "#F97316",
  },
  slotEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotIcon: {
    fontSize: 28,
  },
  slotLabel: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  slotCta: {
    color: "#64748B",
    fontSize: 12,
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  slotOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(249,115,22,0.85)",
    paddingVertical: 6,
    alignItems: "center",
  },
  slotOverlayText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipHint: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
