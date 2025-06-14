import axios from 'axios';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firabase';

interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  pageCount: number;
  publisher: string;
  publishedDate: string;
  imageLinks: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  averageRating?: number;
}

export interface UserBookRating {
  userId: string;
  bookId: string;
  rating: number;
  timestamp: Date;
}

interface BooksApiResponse {
  books: Book[];
}

const API_BASE_URL = 'https://reactnd-books-api.udacity.com';
const AUTH_TOKEN = 'some-fake-token-1234567890';

/**
 * Cache para almacenar todos los libros y evitar recargas innecesarias.
 */
let allBooksCache: Book[] | null = null;

/**
 * Obtiene la lista de todos los libros disponibles desde el API.
 * @returns Una promesa que resuelve con un array de objetos Book.
 * @throws Si la petición falla.
 */
export const getBooks = async (): Promise<Book[]> => {
  if (allBooksCache && allBooksCache.length > 0) {
    return allBooksCache;
  }

  try {
    const response = await axios.get<BooksApiResponse>(
      `${API_BASE_URL}/books`,
      {
        headers: {
          Authorization: AUTH_TOKEN,
        },
      }
    );
    allBooksCache = response.data.books;
    return allBooksCache;
  } catch (error) {
    console.error('Error al obtener los libros:', error);
    throw error;
  }
};

/**
 * Obtiene un solo libro por su ID.
 * @param bookId El ID del libro a buscar.
 * @returns Una promesa que resuelve con un objeto Book o null si no se encuentra.
 * @throws Si la petición falla.
 */
export const getBookById = async (bookId: string): Promise<Book | null> => {
  try {
    const response = await axios.get<{ book: Book }>(
      `${API_BASE_URL}/books/${bookId}`,
      {
        headers: {
          Authorization: AUTH_TOKEN,
        },
      }
    );
    return response.data.book;
  } catch (error: any) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status === 404
    ) {
      console.warn(`Libro con ID ${bookId} no encontrado.`);
      return null;
    }
    console.error(`Error al obtener el libro con ID ${bookId}:`, error);
    throw error;
  }
};

/**
 * Busca libros en la lista completa por un término de consulta.
 * Realiza una búsqueda en el título y los autores.
 * @param query El término de búsqueda.
 * @returns Una promesa que resuelve con un array de objetos Book que coinciden con la consulta.
 * @throws Si la obtención de todos los libros falla.
 */
export const searchBooks = async (query: string): Promise<Book[]> => {
  const allBooks = await getBooks();
  if (!query) {
    return allBooks;
  }

  const lowerCaseQuery = query.toLowerCase();

  return allBooks.filter((book) => {
    const matchesTitle = book.title.toLowerCase().includes(lowerCaseQuery);
    const matchesAuthor = book.authors.some((author) =>
      author.toLowerCase().includes(lowerCaseQuery)
    );
    return matchesTitle || matchesAuthor;
  });
};

/**
 * Guarda o actualiza la calificación de un usuario para un libro específico.
 * @param userId El ID del usuario.
 * @param bookId El ID del libro.
 * @param rating La calificación (número del 1 al 5).
 */
export const saveUserBookRating = async (
  userId: string,
  bookId: string,
  rating: number
): Promise<void> => {
  try {
    const ratingDocRef = doc(db, 'bookRatings', `${userId}_${bookId}`);

    const userBookRating: UserBookRating = {
      userId,
      bookId,
      rating,
      timestamp: new Date(),
    };

    await setDoc(ratingDocRef, userBookRating, { merge: true });
    console.log(
      `Calificación de ${rating} para el libro ${bookId} por el usuario ${userId} guardada.`
    );
  } catch (error) {
    console.error('Error al guardar la calificación del libro:', error);
    throw error;
  }
};

/**
 * Obtiene la calificación de un usuario para un libro específico.
 * @param userId El ID del usuario.
 * @param bookId El ID del libro.
 * @returns La calificación del usuario o null si no existe.
 */
export const getUserRatingForBook = async (
  userId: string,
  bookId: string
): Promise<number | null> => {
  try {
    const ratingDocRef = doc(db, 'bookRatings', `${userId}_${bookId}`);
    const ratingDocSnap = await getDoc(ratingDocRef);

    if (ratingDocSnap.exists()) {
      return ratingDocSnap.data().rating;
    }
    return null;
  } catch (error) {
    console.error(
      `Error al obtener la calificación del usuario ${userId} para el libro ${bookId}:`,
      error
    );
    return null;
  }
};

/**
 * Obtiene todas las calificaciones para un libro específico.
 * @param bookId El ID del libro.
 * @returns Un array de todas las calificaciones para ese libro.
 */
export const getAllRatingsForBook = async (
  bookId: string
): Promise<UserBookRating[]> => {
  try {
    const q = query(
      collection(db, 'bookRatings'),
      where('bookId', '==', bookId)
    );
    const querySnapshot = await getDocs(q);
    const ratings: UserBookRating[] = [];
    querySnapshot.forEach((doc) => {
      ratings.push(doc.data() as UserBookRating);
    });
    return ratings;
  } catch (error) {
    console.error(
      `Error al obtener todas las calificaciones para el libro ${bookId}:`,
      error
    );
    return [];
  }
};

/**
 * Calcula el promedio de las calificaciones de un libro.
 * @param bookId El ID del libro.
 * @returns El promedio de calificación o 0 si no hay calificaciones.
 */
export const getAverageRatingForBook = async (
  bookId: string
): Promise<number> => {
  try {
    const allRatings = await getAllRatingsForBook(bookId);
    if (allRatings.length === 0) {
      return 0;
    }
    const totalRating = allRatings.reduce(
      (sum, rating) => sum + rating.rating,
      0
    );
    return totalRating / allRatings.length;
  } catch (error) {
    console.error(
      `Error al calcular el promedio de calificaciones para el libro ${bookId}:`,
      error
    );
    return 0;
  }
};
