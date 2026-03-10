import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: any;
}

export function Screen({ children, scroll = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const Container = scroll ? ScrollView : View;

  return (
    <Container
      style={[styles.container, { paddingTop: insets.top }, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
