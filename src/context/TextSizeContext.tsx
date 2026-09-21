import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { TEXT_SIZE_SCALE, TextSizeKey } from "../typography";

const KEY = "billwise_text_size";

interface TextSizeValue {
  size: TextSizeKey;
  scale: number;
  setSize: (s: TextSizeKey) => void;
}

const TextSizeContext = createContext<TextSizeValue>({ size: "default", scale: 1, setSize: () => {} });

/** Remembers the "Text size" choice from Profile between app launches. */
export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [size, setSizeState] = useState<TextSizeKey>("default");

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (v === "small" || v === "default" || v === "large") setSizeState(v);
      })
      .catch(() => {});
  }, []);

  const setSize = useCallback((s: TextSizeKey) => {
    setSizeState(s);
    SecureStore.setItemAsync(KEY, s).catch(() => {});
  }, []);

  const value = useMemo(() => ({ size, scale: TEXT_SIZE_SCALE[size], setSize }), [size, setSize]);
  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}

export const useTextSize = () => useContext(TextSizeContext);
export const useTextScale = () => useContext(TextSizeContext).scale;
