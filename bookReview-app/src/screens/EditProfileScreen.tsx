import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppHeader from '../components/AppHeader';
import CustomButton from '../components/CustomButton';
import { auth } from '../config/firabase';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
} from '../services/user.service';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAccount: undefined;
  BookDetail: { bookId: string };
  Profile: undefined;
  EditProfile: undefined;
};

type EditProfileScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'EditProfile'
>;

const EditProfileScreen: React.FC<EditProfileScreenNavigationProp> = ({
  navigation,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const currentUser = auth.currentUser;

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setFirstName(profile.firstName);
          setLastName(profile.lastName);
          setProfilePicture(profile.profilePictureUrl || null);
        }
      }
    } catch (err) {
      console.error('Error al cargar el perfil:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar la información del perfil.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const pickImage = async () => {
    if (!currentUser) {
      Toast.show({
        type: 'info',
        text1: 'No autenticado',
        text2: 'Debes iniciar sesión para cambiar tu foto de perfil.',
      });
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permiso denegado',
        text2: 'Necesitamos permiso para acceder a tu galería de fotos.',
      });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      setUploadingImage(true);
      try {
        const downloadURL = await uploadProfilePicture(
          currentUser.uid,
          selectedImageUri
        );
        setProfilePicture(downloadURL);
        Toast.show({
          type: 'success',
          text1: '¡Foto Actualizada!',
          text2: 'Tu foto de perfil ha sido actualizada con éxito.',
        });
      } catch (err) {
        console.error('Error al subir la imagen:', err);
        Toast.show({
          type: 'error',
          text1: 'Error de subida',
          text2: 'No se pudo subir la foto de perfil. Intenta de nuevo.',
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Usuario no autenticado.',
      });
      return;
    }

    if (firstName.trim() === '' || lastName.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Campos Vacíos',
        text2: 'Por favor, completa tu nombre y apellido.',
      });
      return;
    }

    try {
      await updateUserProfile(currentUser.uid, { firstName, lastName });
      Toast.show({
        type: 'success',
        text1: '¡Perfil Actualizado!',
        text2: 'Tu información personal ha sido guardada.',
      });
      navigation.goBack();
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar el perfil. Intenta de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const isSaveButtonDisabled =
    firstName.trim() === '' || lastName.trim() === '' || saving;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Editar Perfil" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileImageWrapper}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.profileImageContainer}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <Image
                source={
                  profilePicture
                    ? { uri: profilePicture }
                    : require('../../assets/profile-default2.png')
                }
                style={styles.profileImage}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.cameraIconContainer}
            disabled={uploadingImage}
          >
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.imageHintText}>
          Toca para cambiar la foto de perfil
        </Text>

        <Text style={styles.label}>Nombre:</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ingresa tu nombre"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Apellido:</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Ingresa tu apellido"
          placeholderTextColor="#999"
        />

        <CustomButton
          title={saving ? 'Guardando...' : 'Guardar Cambios'}
          onPress={handleSave}
          color={isSaveButtonDisabled ? '#cccccc' : '#439b8c'}
          textStyle={{ fontSize: 18 }}
          style={styles.saveButton}
          disabled={isSaveButtonDisabled}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#555',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginLeft: '10%',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 30,
    width: '80%',
    maxWidth: 300,
  },
  avatarIcon: {
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#004d40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#004d40',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  imageHintText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditProfileScreen;
