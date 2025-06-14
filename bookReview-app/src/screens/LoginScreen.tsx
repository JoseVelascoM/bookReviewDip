import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../config/firabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomButton from '../components/CustomButton';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAccount: undefined;
};

type LoginScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

const LoginScreen: React.FC<LoginScreenNavigationProp> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const LOGIN_TIMEOUT = 10000;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    console.log(`[${new Date().toLocaleTimeString()}] Inicio de handleLogin.`);

    try {
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Tiempo de espera agotado. El inicio de sesión tardó demasiado.'
            )
          );
        }, LOGIN_TIMEOUT);
      });

      console.log(
        `[${new Date().toLocaleTimeString()}] Intentando signInWithEmailAndPassword con timeout de ${
          LOGIN_TIMEOUT / 1000
        }s...`
      );
      await Promise.race([
        signInWithEmailAndPassword(auth, email, password),
        timeoutPromise,
      ]);

      console.log(
        `[${new Date().toLocaleTimeString()}] signInWithEmailAndPassword exitoso.`
      );
    } catch (error: any) {
      console.error(
        `[${new Date().toLocaleTimeString()}] Error de inicio de sesión:`,
        error
      );
      let errorMessage = 'Ocurrió un error al iniciar sesión.';

      if (
        error.message ===
        'Tiempo de espera agotado. El inicio de sesión tardó demasiado.'
      ) {
        errorMessage =
          'El servidor de autenticación tardó demasiado en responder. Por favor, intenta de nuevo.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        errorMessage =
          'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage =
          'Demasiados intentos fallidos. Intenta de nuevo más tarde.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage =
          'Problema de conexión: Asegúrate de tener internet o de que tu emulador de Firebase esté funcionando.';
      }
      Alert.alert('Error de inicio de sesión', errorMessage);
      console.log(
        `[${new Date().toLocaleTimeString()}] Alerta de error mostrada.`
      );
    } finally {
      setLoading(false);
      console.log(
        `[${new Date().toLocaleTimeString()}] Finalizando handleLogin.`
      );
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('CreateAccount');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>¡Bienvenido!</Text>
      <Text style={styles.appName}>BookReview</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <CustomButton
        title="Ingresar"
        onPress={handleLogin}
        isLoading={loading}
        style={styles.button}
      />

      <CustomButton
        title="Crear cuenta"
        onPress={handleCreateAccount}
        color="#607281"
        style={[styles.createAccountButtonMargin, styles.button]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e0f7fa',
  },
  welcomeText: {
    fontSize: 24,
    color: '#00796b',
    marginBottom: 10,
    fontWeight: 'normal',
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    fontFamily: 'serif',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#b2dfdb',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#333',
  },
  createAccountButtonMargin: {
    marginTop: 15,
  },
  button: {
    width: '60%',
  },
});

export default LoginScreen;
