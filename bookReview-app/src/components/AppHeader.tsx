import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = true,
}) => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {showBackButton && (
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {showBackButton && <View style={styles.backButtonPlaceholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 30 : 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#439b8c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backButtonPlaceholder: {
    width: 28 + 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
});

export default AppHeader;
