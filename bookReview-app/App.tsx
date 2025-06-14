import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Toast, {
  ErrorToast,
  InfoToast,
  SuccessToast,
} from 'react-native-toast-message';
import { StyleSheet } from 'react-native';

export default function App() {
  const toastConfig = {
    success: (props: any) => (
      <SuccessToast
        {...props}
        text1Style={styles.toastText1}
        text2Style={styles.toastText2}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        text1Style={styles.toastText1}
        text2Style={styles.toastText2}
      />
    ),
    info: (props: any) => (
      <InfoToast
        {...props}
        style={styles.toastInfoBorder}
        text1Style={styles.toastText1}
        text2Style={styles.toastText2}
      />
    ),
  };

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <Toast topOffset={100} config={toastConfig} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toastText1: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  toastText2: {
    fontSize: 14,
  },
  toastInfoBorder: {
    borderLeftWidth: 5,
    borderLeftColor: '#e4cc43',
  },
});
