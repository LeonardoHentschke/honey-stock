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
  Sales: NavigatorScreenParams<SalesStackParamList>;
  Contacts: NavigatorScreenParams<ContactsStackParamList>;
  More: undefined;
};

// ─── Products Stack ───────────────────────────────────────────────────────────
export type ProductsStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
  VariantDetail: { variantId: string };
};

// ─── Sales Stack ──────────────────────────────────────────────────────────────
export type SalesStackParamList = {
  SalesList: undefined;
  NewSale: undefined;
  SaleDetail: { saleId: string };
};

// ─── Contacts Stack ───────────────────────────────────────────────────────────
export type ContactsStackParamList = {
  ContactsList: undefined;
  CustomerDetail: { customerId: string };
  SupplierDetail: { supplierId: string };
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
