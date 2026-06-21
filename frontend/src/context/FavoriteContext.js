import React, { createContext, useContext, useEffect, useState } from 'react';
import { favoriteService } from '../services/api';
import { AuthContext } from './AuthContext';
import FavoritePopup from '../components/FavoritePopup';

export const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [popupData, setPopupData] = useState({ show: false, product: null, isAdded: false });

  useEffect(() => {
    if (user) {
      favoriteService.getMineIds()
        .then((ids) => setFavoriteIds(new Set(ids)))
        .catch(() => setFavoriteIds(new Set()));
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const toggleFavorite = async (product) => {
    if (!user) return false;
    
    const isFavorited = favoriteIds.has(product.id);
    try {
      if (isFavorited) {
        await favoriteService.remove(product.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        showPopup(product, false);
      } else {
        await favoriteService.add(product.id);
        setFavoriteIds((prev) => new Set(prev).add(product.id));
        showPopup(product, true);
      }
      return true;
    } catch {
      return false;
    }
  };

  const showPopup = (product, isAdded) => {
    setPopupData({ show: true, product, isAdded });
  };

  const closePopup = () => {
    setPopupData((prev) => ({ ...prev, show: false }));
  };

  return (
    <FavoriteContext.Provider value={{ favoriteIds, toggleFavorite }}>
      {children}
      <FavoritePopup 
        show={popupData.show} 
        product={popupData.product} 
        isAdded={popupData.isAdded} 
        onClose={closePopup} 
      />
    </FavoriteContext.Provider>
  );
}
