import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: { tab?: 'owner' | 'member' };
  ForgotPassword: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// ─── App Tabs ─────────────────────────────────────────────────────────────────
export type AppTabsParamList = {
  Dashboard: undefined;
  Products: NavigatorScreenParams<ProductsStackParamList>;
  Sales: undefined;
  Contacts: NavigatorScreenParams<ContactsStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};

// ─── More Stack ───────────────────────────────────────────────────────────────
export type MoreStackParamList = {
  MoreHome: undefined;
  Reminders: undefined;
  ReminderDetail: { reminderId: string };
  Reports: undefined;
  Profile: undefined;
  StockMoves: undefined;
  Notifications: undefined;
  Team: undefined;
  Settings: undefined;
  SalesHistory: undefined;
  SaleDetail: { saleId: string };
};

// ─── Products Stack ───────────────────────────────────────────────────────────
export type ProductsStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
};

// ─── Contacts Stack ───────────────────────────────────────────────────────────
export type ContactsStackParamList = {
  ContactsList: undefined;
  CustomerDetail: { customerId: string };
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabsParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AppTabsScreenProps<T extends keyof AppTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabsParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

// Declaração global para o TypeScript do React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
