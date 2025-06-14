import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firabase';
import CustomButton from '../components/CustomButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAccount: undefined;
};

type CreateAccountScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'CreateAccount'
>;

const CreateAccountScreen: React.FC<CreateAccountScreenNavigationProp> = ({
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error de Registro', 'Por favor, completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error de Registro', 'Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Error de Registro',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        'Error de Registro',
        'Por favor, introduce un correo electrónico válido.'
      );
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Registro Exitoso', '¡Tu cuenta ha sido creada con éxito!');
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      let errorMessage = 'Ocurrió un error al crear la cuenta.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage =
          'Este correo electrónico ya está en uso. Intenta iniciar sesión o usa otro correo.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage =
          'La contraseña es demasiado débil. Por favor, usa una más fuerte.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage =
          'Problema de conexión: Asegúrate de tener internet o de que tu emulador de Firebase esté funcionando.';
      }
      Alert.alert('Error de Registro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear una Cuenta</Text>
      <Text style={styles.subtitle}>Únete a la comunidad de BookReview</Text>

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
      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <CustomButton
        title="Registrarse"
        onPress={handleSignUp}
        isLoading={loading}
        style={styles.buttonSpacing}
      />

      <CustomButton
        title="Ya tengo una cuenta"
        onPress={() => navigation.goBack()}
        color="#6c757d"
        style={styles.buttonSpacing}
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
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
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
  buttonSpacing: {
    marginTop: 15,
    width: '100%',
  },
});

export default CreateAccountScreen;
