import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  getBookById,
  saveUserBookRating,
  getUserRatingForBook,
  getAverageRatingForBook,
} from '../services/books.service';
import AppHeader from '../components/AppHeader';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../config/firabase';
import {
  isBookInUserLibrary,
  addBookToUserLibrary,
  removeBookFromUserLibrary,
} from '../services/user.service';
import CustomButton from '../components/CustomButton';
import Toast from 'react-native-toast-message';
import StarRating from 'react-native-star-rating-widget';
import { MaterialIcons } from '@expo/vector-icons';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAccount: undefined;
  BookDetail: { bookId: string };
};

type BookDetailScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'BookDetail'
>;

interface Book {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  imageLinks: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  averageRating?: number;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
}

const BookDetailScreen: React.FC<BookDetailScreenNavigationProp> = ({
  route,
  navigation,
}) => {
  const { bookId } = route.params;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookAdded, setIsBookAdded] = useState(false);
  const [loadingLibraryAction, setLoadingLibraryAction] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatingsCount, setTotalRatingsCount] = useState<number>(0);
  const [loadingRating, setLoadingRating] = useState(true);
  const currentUser = auth.currentUser;

  const checkBookStatus = useCallback(async () => {
    if (!currentUser) {
      setIsBookAdded(false);
      return;
    }
    setLoadingLibraryAction(true);
    try {
      const added = await isBookInUserLibrary(currentUser.uid, bookId);
      setIsBookAdded(added);
    } catch (err) {
      console.error('Error al verificar estado de libro en biblioteca:', err);
    } finally {
      setLoadingLibraryAction(false);
    }
  }, [bookId]);

  const fetchRatings = useCallback(async () => {
    setLoadingRating(true);
    try {
      if (currentUser) {
        const rating = await getUserRatingForBook(currentUser.uid, bookId);
        setUserRating(rating || 0);
      } else {
        setUserRating(0);
      }

      const avg = await getAverageRatingForBook(bookId);
      setAverageRating(avg);

      const allRatings = await (
        await import('../services/books.service')
      ).getAllRatingsForBook(bookId);
      setTotalRatingsCount(allRatings.length);
    } catch (err) {
      console.error('Error al cargar calificaciones:', err);
    } finally {
      setLoadingRating(false);
    }
  }, [bookId, currentUser]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedBook = await getBookById(bookId);
        if (fetchedBook) {
          setBook(fetchedBook);
          await checkBookStatus();
          await fetchRatings();
        } else {
          setError('Libro no encontrado.');
        }
      } catch (err) {
        console.error('Error al obtener detalles del libro:', err);
        setError('No se pudieron cargar los detalles del libro.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, checkBookStatus, fetchRatings]);

  const handleToggleLibrary = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Toast.show({
        type: 'info',
        text1: 'No autenticado',
        text2: 'Debes iniciar sesión para agregar libros a tu biblioteca.',
      });
      return;
    }

    setLoadingLibraryAction(true);
    try {
      if (isBookAdded) {
        await removeBookFromUserLibrary(currentUser.uid, bookId);
        Toast.show({
          type: 'info',
          text1: '¡Removido!',
          text2: 'Libro eliminado de tu biblioteca.',
          visibilityTime: 3000,
        });
      } else {
        await addBookToUserLibrary(currentUser.uid, bookId);
        Toast.show({
          type: 'success',
          text1: '¡Agregado!',
          text2: 'Libro agregado a tu biblioteca.',
          visibilityTime: 3000,
        });
      }
      setIsBookAdded(!isBookAdded);
    } catch (err) {
      console.error('Error al gestionar la biblioteca:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          'Hubo un problema al actualizar tu biblioteca. Intenta de nuevo.',
      });
    } finally {
      setLoadingLibraryAction(false);
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!currentUser) {
      Toast.show({
        type: 'info',
        text1: 'No autenticado',
        text2: 'Debes iniciar sesión para calificar libros.',
        visibilityTime: 4000,
      });
      return;
    }

    setUserRating(rating);
    try {
      await saveUserBookRating(currentUser.uid, bookId, rating);
      Toast.show({
        type: 'success',
        text1: '¡Calificación Guardada!',
        text2: `Has calificado este libro con ${rating} estrellas.`,
        visibilityTime: 2000,
      });
      await fetchRatings();
    } catch (err) {
      console.error('Error al guardar la calificación:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar tu calificación. Intenta de nuevo.',
        visibilityTime: 4000,
      });
      await fetchRatings();
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Cargando detalles del libro...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <AppHeader title="Detalles del Libro" showBackButton={true} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centeredContainer}>
        <AppHeader title="Detalles del Libro" showBackButton={true} />
        <Text style={styles.errorText}>Libro no encontrado.</Text>
      </View>
    );
  }

  const authors = book.authors ? book.authors.join(', ') : 'Autor desconocido';
  const ratingText = book.averageRating
    ? `⭐ ${book.averageRating.toFixed(1)}`
    : 'Sin calificación';

  return (
    <View style={styles.fullScreenContainer}>
      <AppHeader title="Detalle del Libro" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Image
          source={{
            uri:
              book.imageLinks?.thumbnail ||
              book.imageLinks?.smallThumbnail ||
              'https://via.placeholder.com/256x386?text=No+Image',
          }}
          style={styles.bookImage}
        />
        <TouchableOpacity
          onPress={handleToggleLibrary}
          style={styles.libraryIconContainer}
          disabled={loadingLibraryAction}
        >
          {loadingLibraryAction ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons
              name={isBookAdded ? 'bookmark-added' : 'bookmark-add'}
              size={30}
              color={isBookAdded ? 'rgb(28, 105, 177)' : '#666'}
            />
          )}
        </TouchableOpacity>

        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{authors}</Text>
        <Text style={styles.bookRating}>{ratingText}</Text>

        <View style={styles.userRatingSection}>
          <Text style={styles.userRatingTitle}>Califica este libro:</Text>
          {loadingRating ? (
            <ActivityIndicator
              size="small"
              color="#0000ff"
              style={{ marginTop: 10 }}
            />
          ) : (
            <StarRating
              rating={userRating}
              onChange={handleRatingChange}
              maxStars={5}
              starSize={35}
              color={'#f39c12'}
              emptyColor={'#ccc'}
              animationConfig={{ scale: 1.2, duration: 150 }}
            />
          )}
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Páginas:</Text>{' '}
            {book.pageCount || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Editor:</Text>{' '}
            {book.publisher || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Fecha de publicación:</Text>{' '}
            {book.publishedDate || 'N/A'}
          </Text>
        </View>

        {book.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Descripción:</Text>
            <Text style={styles.descriptionText}>
              {book.description.replace(/<[^>]*>?/gm, '')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  centeredContainer: {
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
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookImage: {
    width: 200,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'cover',
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  bookTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  bookAuthor: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  bookRating: {
    fontSize: 18,
    color: '#f39c12',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginTop: 25,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  userRatingSection: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userRatingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 10,
  },
  detailsSection: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#b2dfdb',
    paddingBottom: 5,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  libraryIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10.,
    backgroundColor: 'rgba(255, 255, 255, 0.83)',
    borderRadius: 25,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default BookDetailScreen;
