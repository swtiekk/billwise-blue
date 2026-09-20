export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;

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
  ScanBill: undefined;
  BillForm: { initial?: { name?: string; category?: string } } | undefined;
};
