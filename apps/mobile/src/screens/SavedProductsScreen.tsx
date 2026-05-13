import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useProductStore } from '../store/productStore';

export default function SavedProductsScreen() {
  const { savedProducts, loadSavedProducts } = useProductStore();

  useEffect(() => {
    loadSavedProducts();
  }, []);

  return (
    <View style={styles.container}>
      {savedProducts.length > 0 ? (
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved products</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  item: { backgroundColor: '#fff', padding: 16, marginBottom: 12, marginHorizontal: 16, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  price: { fontSize: 18, fontWeight: '700', color: '#3b82f6' },
  notes: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
