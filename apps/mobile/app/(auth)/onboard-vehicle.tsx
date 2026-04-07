import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import type { Platform as GigPlatform } from "@wrapped/shared";

const schema = z.object({
  vehicle_make: z.string().min(1, "Required"),
  vehicle_model: z.string().min(1, "Required"),
  vehicle_year: z
    .string()
    .regex(/^\d{4}$/, "Enter a valid year")
    .refine(
      (y) => parseInt(y) >= 2010 && parseInt(y) <= new Date().getFullYear() + 1,
      "Enter a year between 2010 and now",
    ),
  license_plate: z.string().min(2, "Required"),
  city: z.string().min(2, "Required"),
});

type FormData = z.infer<typeof schema>;

const PLATFORMS: { label: string; value: GigPlatform }[] = [
  { label: "Uber", value: "uber" },
  { label: "Lyft", value: "lyft" },
  { label: "DoorDash", value: "doordash" },
  { label: "Skip", value: "skip" },
  { label: "Instacart", value: "instacart" },
];

export default function OnboardVehicleScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<GigPlatform | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!selectedPlatform) {
      Alert.alert(
        "Select a platform",
        "Please select the platform you drive for.",
      );
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Session expired", "Please sign in again.");
      router.replace("/(auth)/login");
      return;
    }

    const { error } = await supabase.from("drivers").upsert({
      user_id: user.id,
      full_name: user.user_metadata.full_name,
      phone: user.user_metadata.phone,
      platform: selectedPlatform,
      vehicle_make: data.vehicle_make,
      vehicle_model: data.vehicle_model,
      vehicle_year: parseInt(data.vehicle_year),
      license_plate: data.license_plate.toUpperCase(),
      city: data.city,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error saving vehicle info", error.message);
    } else {
      router.push("/(auth)/onboard-photos");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Info</Text>
          <Text style={styles.subtitle}>Step 2 of 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "66%" }]} />
          </View>
        </View>

        {/* Platform selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Platform</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.platformChip,
                  selectedPlatform === value && styles.platformChipActive,
                ]}
                onPress={() => setSelectedPlatform(value)}
              >
                <Text
                  style={[
                    styles.platformChipText,
                    selectedPlatform === value && styles.platformChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form fields */}
        <View style={styles.form}>
          {[
            {
              name: "vehicle_make" as const,
              label: "Make",
              placeholder: "Honda",
            },
            {
              name: "vehicle_model" as const,
              label: "Model",
              placeholder: "Civic",
            },
            {
              name: "vehicle_year" as const,
              label: "Year",
              placeholder: "2022",
              keyboard: "number-pad" as const,
            },
            {
              name: "license_plate" as const,
              label: "License Plate",
              placeholder: "ABCD 123",
            },
            { name: "city" as const, label: "City", placeholder: "Calgary" },
          ].map(({ name, label, placeholder, keyboard }) => (
            <View key={name} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors[name] && styles.inputError]}
                    placeholder={placeholder}
                    placeholderTextColor="#64748B"
                    keyboardType={keyboard ?? "default"}
                    autoCapitalize={
                      name === "license_plate" ? "characters" : "words"
                    }
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors[name] && (
                <Text style={styles.error}>{errors[name]?.message}</Text>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 32,
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
  section: {
    marginBottom: 24,
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  platformChip: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1E293B",
  },
  platformChipActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  platformChipText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
  platformChipTextActive: {
    color: "#fff",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F8FAFC",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
