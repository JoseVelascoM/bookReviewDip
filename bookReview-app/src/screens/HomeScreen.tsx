import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getBooks, searchBooks } from '../services/books.service';
import CustomButton from '../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';

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

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAccount: undefined;
  BookDetail: { bookId: string };
  Profile: undefined;
  EditProfile: undefined;
};

type HomeScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;

const HomeScreen: React.FC<HomeScreenNavigationProp> = ({ navigation }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBooks = useCallback(async (query: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const fetchedBooks = await searchBooks(query);
      setBooks(fetchedBooks);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('No se pudieron cargar los libros. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      loadBooks(query);
    }, 300),
    [loadBooks]
  );

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleLogout = async () => {
    setShowMenu(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      Alert.alert('Error', 'Hubo un error al cerrar sesión.');
    }
  };

  const handleProfilePress = () => {
    setShowMenu(false);
    navigation.navigate('Profile');
  };

  const handleBookPress = (bookId: string) => {
    setShowMenu(false);
    navigation.navigate('BookDetail', { bookId });
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      onPress={() => handleBookPress(item.id)}
      style={styles.bookItem}
    >
      <Image
        source={{
          uri:
            item.imageLinks?.thumbnail ||
            'https://via.placeholder.com/128x193?text=No+Image',
        }}
        style={styles.bookImage}
      />
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>
          {item.authors ? item.authors.join(', ') : 'Autor desconocido'}
        </Text>
        {item.averageRating && (
          <Text style={styles.bookRating}>
            ⭐ {item.averageRating.toFixed(1)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Cargando libros...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton
          title="Cerrar Sesión"
          onPress={handleLogout}
          color="#dc3545"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>BookReview</Text>
        <TouchableOpacity
          onPress={() => setShowMenu(!showMenu)}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-vertical" size={28} color="#004d40" />
        </TouchableOpacity>
      </View>

      {showMenu && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemText}>Perfil</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={[styles.menuItemText, styles.logoutText]}>
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar libros por título o autor..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearchChange}
      />

      <Text style={styles.sectionTitle}>Libros Disponibles</Text>
      {books.length > 0 ? (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.noBooksText}>No se encontraron libros.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
    backgroundColor: '#e0f7fa',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004d40',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'serif',
  },
  menuButton: {
    padding: 5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 90,
    right: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    paddingVertical: 5,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutText: {
    color: '#dc3545',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#b2dfdb',
    paddingBottom: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  bookImage: {
    width: 90,
    height: 135,
    borderRadius: 6,
    marginRight: 15,
    resizeMode: 'cover',
    backgroundColor: '#eee',
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 15,
    color: '#666',
    marginBottom: 3,
  },
  bookRating: {
    fontSize: 15,
    color: '#f39c12',
    fontWeight: 'bold',
  },
  noBooksText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  searchInput: {
    height: 50,
    borderColor: '#b2dfdb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default HomeScreen;
