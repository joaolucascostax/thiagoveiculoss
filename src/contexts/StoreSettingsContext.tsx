import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useStoreSettings, type StoreSettings } from "@/hooks/useStoreSettings";
import { applyPalette } from "@/lib/colors";
import { initMetaPixel } from "@/lib/metaPixel";
import { getSessionId } from "@/lib/tracking";

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  isLoading: boolean;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: null,
  isLoading: true,
});

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useStoreSettings();

  useEffect(() => {
    if (data) {
      applyPalette({
        color_primary: (data as any).color_primary,
        color_background: (data as any).color_background,
        color_foreground: (data as any).color_foreground,
      });
      // Meta Pixel dinâmico + Advanced Matching (external_id estável)
      initMetaPixel((data as any).meta_pixel_id, getSessionId());
    }
  }, [data]);


  const isAdminRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  if (isLoading && !isAdminRoute) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#000" }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <StoreSettingsContext.Provider value={{ settings: data ?? null, isLoading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(StoreSettingsContext);
}
