import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

type Extra = { backendUrl?: string };

const extra: Extra =
  (Constants?.expoConfig?.extra as Extra) ??
  ((Updates.manifest as any)?.extra as Extra) ??
  {};

export const BACKEND_URL = extra.backendUrl ?? 'http://localhost:3001';