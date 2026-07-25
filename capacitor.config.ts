import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.valdezandco.swiftkds',
  appName: 'SwiftKDS',
  webDir: 'out',  // Next.js static export output directory

  server: {
    androidScheme: 'https',
    // allowNavigation: ['*.swiftkds.com'] // for custom domain whitelisting
  },

  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications (for order chime fallback)
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#7c3aed',
      sound: 'new-order.wav',
    },

    // Haptics are available via @capacitor/haptics plugin
    // Integrated into QuickCharge component via navigator.vibrate() with native bridge

    // App metadata
    AppLauncher: {},
  },

  ios: {
    // Required for Stripe Terminal Tap to Pay on iPhone
    // Must request Apple Tap to Pay entitlement separately via Apple Developer portal
    contentInset: 'automatic',
    backgroundColor: '#0f0f11',
    scrollEnabled: true,
  },

  android: {
    backgroundColor: '#0f0f11',
    // Required for Stripe Terminal on Android
    allowMixedContent: false,
  },
};

export default config;
