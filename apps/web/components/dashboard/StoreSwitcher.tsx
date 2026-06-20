"use client";

import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Store {
  id: string;
  name: string;
  is_default: boolean;
}

const ALL = "__all__";

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}

function writeStoreCookie(id: string) {
  if (id) {
    document.cookie = `vls_store=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
  } else {
    document.cookie = `vls_store=; path=/; max-age=0; samesite=lax`;
  }
}

/**
 * Header dropdown that scopes the whole dashboard to one store. Selection
 * is persisted in the vls_store cookie; the server-side proxy reads it and
 * injects X-Vectorless-Store. We reload so every page re-fetches in scope.
 */
export default function StoreSwitcher() {
  const [stores, setStores] = useState<Store[]>([]);
  const [current, setCurrent] = useState<string>(ALL);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(readCookie("vls_store") || ALL);
    fetch("/api/dashboard/stores", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setStores(Array.isArray(d) ? d : []))
      .catch(() => setStores([]));
  }, []);

  // Hide the switcher entirely until there's more than the default store —
  // a single-store workspace doesn't need scoping UI.
  if (stores.length <= 1) return null;

  function onChange(val: string) {
    const id = val === ALL ? "" : val;
    writeStoreCookie(id);
    window.location.reload();
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[190px] gap-2" aria-label="Active store">
        <Boxes className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="All stores" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All stores</SelectItem>
        <SelectSeparator />
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
