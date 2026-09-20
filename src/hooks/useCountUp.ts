import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Animates a number from its previous value to `target` (ease-out). Returns the current value;
 * round it where you display it. `null` means "not loaded yet" and leaves the value alone.
 */
export function useCountUp(target: number | null, duration = 900): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (target == null) return;
    if (reduced) {
      from.current = target;
      setValue(target);
      return;
    }

    const start = from.current;
    const began = Date.now();
    let frame = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - began) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (target - start) * eased;
      from.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return value;
}
