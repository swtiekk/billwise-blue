/**
 * The scanner and the manual "Add Bill" form are separate screens. When the user confirms,
 * they publish the bill here and go back; whichever screen opened them (Setup 3 now, Edit
 * Bills later) is subscribed and adds it. This avoids passing callbacks through navigation
 * params, which React Navigation warns about.
 */
export interface BillInput {
  name: string;
  category: string; // one of BILL_CATEGORIES
  dueDay: number; // 1-31
  graceDays: number;
  hasPenalty: boolean;
  amount?: number; // known when it came from a scan
  dueDate?: string; // YYYY-MM-DD, known when it came from a scan
}

type Listener = (bill: BillInput) => void;
const listeners = new Set<Listener>();

export function subscribeBill(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function publishBill(bill: BillInput) {
  listeners.forEach((fn) => fn(bill));
}
