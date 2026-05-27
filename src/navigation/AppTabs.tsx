import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  MoreHorizontal,
} from 'lucide-react-native';
import type { AppTabsParamList } from './types';

// Telas placeholder
import { DashboardScreen } from '@/features/dashboard/views/DashboardScreen';
import { ProductListScreen } from '@/features/products/views/ProductListScreen';
import { SalesScreen } from '@/features/sales/views/SalesScreen';
import { ContactsScreen } from '@/features/customers/views/ContactsScreen';
import { MoreScreen } from '@/features/more/views/MoreScreen';

const Tab = createBottomTabNavigator<AppTabsParamList>();

// Tokens do DESIGN.md
const HONEY_600 = '#C47C0A';
const INK_500 = '#6B6258';
const HONEY_500 = '#E89B12';
const WHITE = '#FFFFFF';
const INK_50 = '#F5F1EA';
const INK_100 = '#E7E2D9';

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopColor: INK_100,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: HONEY_600,
        tabBarInactiveTintColor: INK_500,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: WHITE }} />
        ),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          title: 'Vendas',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.salesTabIcon, focused && styles.salesTabIconActive]}>
              <ShoppingCart size={22} color={WHITE} strokeWidth={2} />
            </View>
          ),
          tabBarLabel: () => null, // sem label no tab central
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: 'Contatos',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'Mais',
          tabBarIcon: ({ color, size }) => (
            <MoreHorizontal size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  salesTabIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: HONEY_500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    // sombra (shadow-lg do DESIGN.md)
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  salesTabIconActive: {
    backgroundColor: HONEY_600,
  },
});
