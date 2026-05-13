import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../services/api';

export default function ProductDetailScreen({ route }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await apiClient.getProduct(productId);
      setProduct(response.data.data);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>${product.price?.toFixed(2)}</Text>
      <Text style={styles.brand}>{product.brand} | {product.finish}</Text>
      <Text style={styles.description}>{product.description}</Text>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Save Product</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
        <Text style={styles.secondaryButtonText}>Compare</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  price: { fontSize: 28, fontWeight: '700', color: '#3b82f6', marginBottom: 8 },
  brand: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  description: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 16 },
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: { backgroundColor: '#e5e7eb' },
  secondaryButtonText: { color: '#1f2937', fontWeight: '600', fontSize: 16 },
  errorText: { fontSize: 16, color: '#ef4444' },
});
