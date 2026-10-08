import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, View } from 'react-native';
import { CelebrateOverlay } from './src/components/CelebrateOverlay';
import { PRToast } from './src/components/PRToast';
import { PressBanner } from './src/components/PressBanner';
import { Header } from './src/components/Header';
import { TabBar } from './src/components/TabBar';
import { DAYS } from './src/data';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { StoreProvider, useStore } from './src/store';
import { COLORS } from './src/theme';
import { canUpdate, checkForUpdate, downloadAndInstall } from './src/updater';

export default function App() {
  // the five faces the design actually uses, each pulled from its own subpath so
  // Metro does not bundle all 36 weights the font packages ship.
  const [ready] = useFonts({
    Barlow_400Regular: require('@expo-google-fonts/barlow/400Regular/Barlow_400Regular.ttf'),
    Barlow_500Medium: require('@expo-google-fonts/barlow/500Medium/Barlow_500Medium.ttf'),
    Barlow_600SemiBold: require('@expo-google-fonts/barlow/600SemiBold/Barlow_600SemiBold.ttf'),
    BarlowCondensed_600SemiBold: require('@expo-google-fonts/barlow-condensed/600SemiBold/BarlowCondensed_600SemiBold.ttf'),
    BarlowCondensed_700Bold: require('@expo-google-fonts/barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf'),
    BarlowCondensed_800ExtraBold: require('@expo-google-fonts/barlow-condensed/800ExtraBold/BarlowCondensed_800ExtraBold.ttf'),
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: COLORS.ink }}>{ready && <StoreProvider><Shell /></StoreProvider>}</View>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { state, actions } = useStore();
  const insets = useSafeAreaInsets();
  const total = DAYS[state.day - 1].exs.length;

  // one quiet look for a newer build per launch; only speaks up if there is one
  useEffect(() => {
    if (!canUpdate()) return;
    checkForUpdate().then((u) => {
      if (u.phase !== 'available') return;
      Alert.alert(
        'Update available',
        `Build ${u.info.build} is ready.${u.info.notes ? '\n\n' + u.info.notes.slice(0, 300) : ''}`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update', onPress: () => void downloadAndInstall() },
        ]
      );
    });
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header onReset={actions.resetDay} />
      <View style={{ flex: 1 }}>
        {state.tab === 'progress' ? <ProgressScreen /> : <TodayScreen />}
      </View>
      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <TabBar tab={state.tab} onPick={actions.setTab} />
      </View>
      {!!state.pressingId && <PressBanner label={state.pressLabel} />}
      {!state.pressingId && !!state.toast && <PRToast toast={state.toast} />}
      {state.celebrate && (
        <CelebrateOverlay day={state.day} total={total} onDismiss={actions.dismiss} />
      )}
    </View>
  );
}
