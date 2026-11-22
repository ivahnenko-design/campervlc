// Pick-up city = which camper. Only rendered when more than one camper is active.
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { FLEET } from "@/data/fleet";
import { MULTI_CAMPER, chooseCamper, useChosenCamper } from "@/lib/vehicle-choice";
import { cityName } from "../../shared/vehicles.js";

export function CitySwitch({ className = "" }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const chosen = useChosenCamper();
  const labelId = useId(); // the switch appears twice on the page (fleet + booking)
  if (!MULTI_CAMPER) return null;
  return (
    <div className={className}>
      <p id={labelId} className="mb-2 text-sm text-muted-foreground">
        {t("fleet.city_choose")}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="inline-flex flex-wrap gap-1 rounded-full border border-border/60 bg-surface p-1"
      >
        {FLEET.map((c) => {
          const on = c.id === chosen.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => chooseCamper(c.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {cityName(c.vehicle, i18n.language)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
