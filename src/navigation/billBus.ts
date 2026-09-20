/**
 * The scanner and the Add Bill form are separate screens. When the user confirms, they publish
 * here and go back; whichever screen opened them (Setup 3, Edit Budget Items, Update Bills) is
 * subscribed and handles it. This avoids passing callbacks through navigation params, which
 * React Navigation warns about.
 */
export interface BillInput {
  id?: string; // present when editing an existing bill (allocation id)
  name: string;
  category: string; // one of BILL_CATEGORIES
  dueDay: number; // 1-31
  graceDays: number;
  hasPenalty: boolean;
  amount?: number; // known when it came from a scan
  dueDate?: string; // YYYY-MM-DD, known when it came from a scan
  min?: number; // expected amount range (Edit Budget Items)
  max?: number;
}

type BillListener = (bill: BillInput) => void;
const billListeners = new Set<BillListener>();

export function subscribeBill(fn: BillListener): () => void {
  billListeners.add(fn);
  return () => {
    billListeners.delete(fn);
  };
}

export function publishBill(bill: BillInput) {
  billListeners.forEach((fn) => fn(bill));
}

// A scan that only supplies a new amount for one existing bill ("Scan New Bill").
type AmountListener = (billId: string, amount: number) => void;
const amountListeners = new Set<AmountListener>();

export function subscribeAmount(fn: AmountListener): () => void {
  amountListeners.add(fn);
  return () => {
    amountListeners.delete(fn);
  };
}

export function publishAmount(billId: string, amount: number) {
  amountListeners.forEach((fn) => fn(billId, amount));
}
