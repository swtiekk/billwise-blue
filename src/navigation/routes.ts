/** Fields of an existing bill passed to the form when the pencil icon is tapped. */
export interface BillEditParams {
  id: string;
  name: string;
  category: string;
  dueDay: number;
  graceDays: number;
  hasPenalty: boolean;
  billerId?: number | null;
  reminderDay?: number | null;
  isDaily?: boolean;
  min: number; // monthly amounts (a daily cost is stored as its monthly equivalent)
  max: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;

  // first-time setup
  SetupHousehold: undefined;
  SetupIncome: undefined;
  SetupBills: undefined;
  SetupRanges: undefined;
  Analysis: undefined;

  // the four tabs
  Home: undefined;
  Budget: undefined;
  Tips: undefined;
  Profile: undefined;

  Notifications: undefined;

  // Profile > Edit Setup (they reuse the setup screens, pre-filled)
  UpdateBills: undefined;
  EditHousehold: undefined;
  EditIncome: undefined;
  EditBills: undefined;
  EditRanges: undefined;

  About: undefined;
  Privacy: undefined;

  // bill entry
  // forBillId = only update that bill's amount; persist = save the bill straight away (used from the tab bar's +, outside setup)
  ScanBill: { forBillId?: string; persist?: boolean } | undefined;
  BillForm:
    | { initial?: { name?: string; category?: string; billerId?: number }; edit?: BillEditParams; needsRange?: boolean; persist?: boolean }
    | undefined;
  BillDetail: { id: string };
  AddBiller: { persist?: boolean } | undefined; // category -> search -> pick a biller, then BillForm
};
