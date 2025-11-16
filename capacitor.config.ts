import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.heradigital.demandas',
  appName: 'Hera Demandas',
  webDir: 'dist',
  server: {
    url: 'https://citizen-loom-db-80163.public.lovable.app',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#8B5CF6',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#8B5CF6'
    }
  }
};

export default config;
