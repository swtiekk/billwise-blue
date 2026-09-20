/** Fields of an existing bill passed to the form when the pencil icon is tapped. */
export interface BillEditParams {
  id: string;
  name: string;
  category: string;
  dueDay: number;
  graceDays: number;
  hasPenalty: boolean;
  min: number;
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
  ScanBill: { forBillId?: string } | undefined; // forBillId = only update that bill's amount
  BillForm:
    | { initial?: { name?: string; category?: string }; edit?: BillEditParams; needsRange?: boolean }
    | undefined;
};
