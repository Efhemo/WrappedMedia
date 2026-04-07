"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../../lib/supabase";

const schema = z.object({
  name: z.string().min(2, "Required"),
  brand: z.string().min(1, "Required"),
  markets: z.string().min(1, "Enter at least one market"),
  driver_count: z.string().regex(/^\d+$/, "Must be a number"),
  wrap_type: z.enum(["full", "partial"]),
  status: z.enum(["scheduled", "live"]),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CampaignForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { wrap_type: "full", status: "scheduled" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.from("campaigns").insert({
      name: data.name,
      brand: data.brand,
      markets: data.markets
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      driver_count: parseInt(data.driver_count),
      wrap_type: data.wrap_type,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date,
      notes: data.notes || null,
    });
    setLoading(false);
    if (!error) {
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-slate-800 border ${hasError ? "border-red-500" : "border-slate-700"} rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {[
        {
          name: "name" as const,
          label: "Campaign Name",
          placeholder: "Spring 2026",
        },
        { name: "brand" as const, label: "Brand", placeholder: "Wendy's" },
        {
          name: "markets" as const,
          label: "Markets (comma separated)",
          placeholder: "Calgary, Vancouver",
        },
        {
          name: "driver_count" as const,
          label: "Target Driver Count",
          placeholder: "50",
        },
      ].map(({ name, label, placeholder }) => (
        <div key={name}>
          <label className="text-slate-400 text-xs font-medium block mb-1">
            {label}
          </label>
          <input
            {...register(name)}
            placeholder={placeholder}
            className={inputClass(!!errors[name])}
          />
          {errors[name] && (
            <p className="text-red-400 text-xs mt-1">{errors[name]?.message}</p>
          )}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1">
            Wrap Type
          </label>
          <select {...register("wrap_type")} className={inputClass(false)}>
            <option value="full">Full</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1">
            Status
          </label>
          <select {...register("status")} className={inputClass(false)}>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1">
            Start Date
          </label>
          <input
            type="date"
            {...register("start_date")}
            className={inputClass(!!errors.start_date)}
          />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1">
            End Date
          </label>
          <input
            type="date"
            {...register("end_date")}
            className={inputClass(!!errors.end_date)}
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-xs font-medium block mb-1">
          Notes (optional)
        </label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Any special instructions..."
          className={`${inputClass(false)} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
      >
        {loading ? "Creating..." : success ? "✓ Created!" : "Create Campaign"}
      </button>
    </form>
  );
}
