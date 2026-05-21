"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
  ),
});

export default function MapClient() {
  return (
    <div className="absolute inset-0">
      <MapView />
    </div>
  );
}
