import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ExtensionMessage, APIResponse, Product } from '@masco/shared';
import './styles/popup.css';

interface ProductData {
  sku?: string;
  title?: string;
  price?: number;
  imageUrl?: string;
  retailer?: string;
  url?: string;
}

const Popup: React.FC = () => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extractProductData = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.id) {
          setError('No active tab found');
          setLoading(false);
          return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_PRODUCT',
        } as ExtensionMessage);

        setProduct(response);

        if (response.sku) {
          const apiResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/api/products/alternatives?sku=${response.sku}`,
            {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
              },
            }
          );

          const data: APIResponse<Product[]> = await apiResponse.json();
          if (data.success && data.data) {
            setAlternatives(data.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    extractProductData();
  }, []);

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loader">
          <div className="spinner"></div>
          <p>Analyzing product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="popup-container">
        <div className="error-box">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="popup-container">
        <div className="info-box">
          <h3>No Product Detected</h3>
          <p>Please navigate to a product page on a supported retailer.</p>
          <p className="text-sm">Supported: Home Depot, Lowe's, Amazon, Wayfair, Build.com, Ferguson</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="product-header">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className="product-image" />
        )}
        <div>
          <h2>{product.title}</h2>
          <p className="price">${product.price?.toFixed(2)}</p>
          <p className="retailer">{product.retailer}</p>
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="alternatives-section">
          <h3>Alternatives & Pricing</h3>
          <div className="alternatives-list">
            {alternatives.slice(0, 3).map((alt) => (
              <div key={alt.id} className="alternative-item">
                <div className="alt-header">
                  <p className="alt-title">{alt.title}</p>
                  <p className="alt-price">${alt.price.toFixed(2)}</p>
                </div>
                <p className="alt-retailer">{alt.retailer}</p>
              </div>
            ))}
          </div>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="view-more-btn">
            View Full Comparison →
          </a>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);
