import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppHeader from '../components/AppHeader';
import CustomButton from '../components/CustomButton';
import { auth } from '../config/firabase';
import { getUserProfile } from '../services/user.service';
import { Ionicons } from '@expo/vector-icons';
import { getBookById } from '../services/books.service';
import { useFocusEffect } from '@react-navigation/native';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAccount: undefined;
  BookDetail: { bookId: string };
  Profile: undefined;
  EditProfile: undefined;
};

type ProfileScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'Profile'
>;

interface UserProfileData {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  library?: string[];
  profilePictureUrl?: string;
}

interface Book {
  id: string;
  title: string;
  authors: string[];
  imageLinks: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  averageRating?: number;
}

const ProfileScreen: React.FC<ProfileScreenNavigationProp> = ({
  navigation,
}) => {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setProfileData(profile);
      } else {
        setError('Usuario no autenticado.');
      }
    } catch (err) {
      console.error('Error al obtener perfil del usuario:', err);
      setError('No se pudo cargar el perfil. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLibraryBooks = useCallback(async (bookIds: string[]) => {
    setLoadingLibrary(true);
    const fetchedBooks: Book[] = [];
    for (const bookId of bookIds) {
      try {
        const book = await getBookById(bookId);
        if (book) {
          fetchedBooks.push(book);
        }
      } catch (err) {
        console.warn(
          `Error al obtener libro con ID ${bookId} para la biblioteca:`,
          err
        );
      }
    }
    setLibraryBooks(fetchedBooks);
    setLoadingLibrary(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();

      return () => {};
    }, [fetchUserProfile])
  );

  useEffect(() => {
    if (profileData?.library) {
      if (profileData.library.length > 0) {
        fetchLibraryBooks(profileData.library);
      } else {
        setLibraryBooks([]);
        setLoadingLibrary(false);
      }
    }
  }, [profileData?.library, fetchLibraryBooks]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleBookPress = (bookId: string) => {
    navigation.navigate('BookDetail', { bookId });
  };

  const renderLibraryBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      onPress={() => handleBookPress(item.id)}
      style={styles.libraryBookItem}
    >
      <Image
        source={{
          uri:
            item.imageLinks?.thumbnail ||
            'https://via.placeholder.com/100x150?text=No+Image',
        }}
        style={styles.libraryBookImage}
      />
      <View style={styles.libraryBookDetails}>
        <Text style={styles.libraryBookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.libraryBookAuthor} numberOfLines={1}>
          {item.authors ? item.authors.join(', ') : 'Autor desconocido'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AppHeader title="Mi Perfil" showBackButton={true} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Mi Perfil" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.profileCardContent}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  profileData?.profilePictureUrl
                    ? { uri: profileData?.profilePictureUrl }
                    : require('../../assets/profile-default2.png')
                }
                style={styles.profileImage}
              />
            </View>
            <Text style={styles.profileText}>
              <Text style={styles.textBold}>Nombre: </Text>
              {profileData?.firstName || 'No especificado'}
            </Text>
            <Text style={styles.profileText}>
              <Text style={styles.textBold}>Apellido: </Text>
              {profileData?.lastName || 'No especificado'}
            </Text>
            <Text style={styles.profileText}>
              <Text style={styles.textBold}>Email: </Text>
              {profileData?.email || 'No especificado'}
            </Text>
            <CustomButton
              title="Editar Perfil"
              onPress={handleEditProfile}
              style={styles.editButton}
            />
          </View>
        </View>

        <View style={styles.librarySection}>
          <Text style={styles.sectionTitle}>Mi Biblioteca</Text>
          {loadingLibrary ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : libraryBooks.length > 0 ? (
            <FlatList
              data={libraryBooks}
              renderItem={renderLibraryBookItem}
              keyExtractor={(item) => item.id}
              horizontal={false}
              numColumns={2}
              contentContainerStyle={styles.libraryList}
              columnWrapperStyle={styles.libraryColumnWrapper}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyLibraryText}>
              Aún no has agregado libros a tu biblioteca.
            </Text>
          )}
        </View>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    paddingTop: 80,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  avatarIcon: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  editButton: {
    marginTop: 20,
    width: '80%',
    maxWidth: 300,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#b2dfdb',
    paddingBottom: 5,
  },
  profileText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '100%',
  },
  profileCardContent: {
    alignItems: 'center',
  },
  librarySection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '100%',
  },
  textBold: {
    fontWeight: 'bold',
  },
  libraryList: {},
  libraryColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  libraryBookItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 5,
  },
  libraryBookImage: {
    width: 80,
    height: 120,
    borderRadius: 4,
    marginBottom: 8,
    resizeMode: 'cover',
    backgroundColor: '#eee',
  },
  libraryBookDetails: {
    width: '100%',
    alignItems: 'center',
  },
  libraryBookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  libraryBookAuthor: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyLibraryText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e4e4e4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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
});

export default ProfileScreen;
