import { db, auth, storage } from '../config/firabase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  library?: string[];
  profilePictureUrl?: string;
}

/**
 * Obtiene los datos del perfil del usuario.
 * @param uid El ID de usuario de Firebase Authentication.
 * @returns Los datos del perfil del usuario, o null si no se encuentra.
 */
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return {
        uid: uid,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || auth.currentUser?.email || '',
        library: data.library || [],
        profilePictureUrl: data.profilePictureUrl || '',
      };
    } else {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        const defaultProfile: UserProfile = {
          uid: currentUser.uid,
          firstName: '',
          lastName: '',
          email: currentUser.email || '',
          library: [],
          profilePictureUrl: '',
        };
        await setDoc(userDocRef, defaultProfile);
        return defaultProfile;
      }
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    throw error;
  }
};

/**
 * Actualiza campos específicos del perfil de usuario en Firestore.
 * @param uid El ID de usuario de Firebase Authentication.
 * @param profileData Los datos parciales del perfil a actualizar.
 */
export const updateUserProfile = async (
  uid: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, profileData);
    console.log('Perfil actualizado con éxito!');
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    throw error;
  }
};

/**
 * Añade un libro a la biblioteca del usuario.
 * @param uid El ID de usuario.
 * @param bookId El ID del libro a añadir.
 */
export const addBookToUserLibrary = async (
  uid: string,
  bookId: string
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      library: arrayUnion(bookId),
    });
    console.log(`Libro ${bookId} añadido a la biblioteca de ${uid}.`);
  } catch (error) {
    console.error(
      `Error al añadir el libro ${bookId} a la biblioteca de ${uid}:`,
      error
    );
    throw error;
  }
};

/**
 * Elimina un libro de la biblioteca del usuario.
 * @param uid El ID de usuario.
 * @param bookId El ID del libro a eliminar.
 */
export const removeBookFromUserLibrary = async (
  uid: string,
  bookId: string
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      library: arrayRemove(bookId),
    });
    console.log(`Libro ${bookId} eliminado de la biblioteca de ${uid}.`);
  } catch (error) {
    console.error(
      `Error al eliminar el libro ${bookId} de la biblioteca de ${uid}:`,
      error
    );
    throw error;
  }
};

/**
 * Verifica si un libro está en la biblioteca del usuario.
 * @param uid El ID de usuario.
 * @param bookId El ID del libro a verificar.
 * @returns true si el libro está en la biblioteca, false en caso contrario.
 */
export const isBookInUserLibrary = async (
  uid: string,
  bookId: string
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.library?.includes(bookId) || false;
  } catch (error) {
    console.error(
      `Error al verificar si el libro ${bookId} está en la biblioteca de ${uid}:`,
      error
    );
    return false;
  }
};

/**
 * Sube una imagen de perfil a Firebase Storage y actualiza la URL en el perfil del usuario.
 * @param uid El ID del usuario.
 * @param imageUri La URI local de la imagen seleccionada.
 * @returns La URL de descarga de la imagen subida.
 */
export const uploadProfilePicture = async (
  uid: string,
  imageUri: string
): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `users/${uid}/profile_pictures/profile.jpg`);
    await uploadBytes(imageRef, blob);

    const downloadURL = await getDownloadURL(imageRef);
    await updateUserProfile(uid, { profilePictureUrl: downloadURL });

    console.log(
      `Imagen de perfil para ${uid} subida y URL guardada: ${downloadURL}`
    );
    return downloadURL;
  } catch (error) {
    console.error('Error al subir la imagen de perfil:', error);
    throw error;
  }
};
