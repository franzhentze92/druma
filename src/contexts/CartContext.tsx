import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CartItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  currency: string;
  quantity: number;
  provider_id: string;
  provider_name: string;
  image_url?: string;
  description?: string;
  delivery_fee?: number;
  has_delivery?: boolean;
  has_pickup?: boolean;
  // Product-specific fields
  product_size?: 'small' | 'medium' | 'large' | 'extra_large' | 'general';
  product_id?: string; // Original product ID (without size suffix)
  product_category?: string; // Product category (e.g., 'alimentos', 'juguetes', etc.)
  // Service-specific fields
  service_size?: string; // Size selected for service (small, medium, large, extra_large)
  service_id?: string; // Original service ID (without size suffix)
  service_data?: {
    service_id: string;
    appointment_date: string;
    time_slot_id: string;
    appointment_time?: string; // HH:MM format - actual time of the appointment
    slot_end_time?: string; // HH:MM format - end time of the slot
    client_name: string;
    client_phone: string;
    client_email: string;
    notes: string;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  delivery_fee: number;
  grand_total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'CALCULATE_TOTALS' };

const initialState: CartState = {
  items: [],
  total: 0,
  delivery_fee: 0,
  grand_total: 0,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // For products with sizes, each size is a separate item (different IDs)
      // For products without sizes or same size, increment quantity
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        item.type === action.payload.type &&
        (action.payload.type === 'service' || item.product_size === action.payload.product_size)
      );
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id && 
          item.type === action.payload.type &&
          (action.payload.type === 'service' || item.product_size === action.payload.product_size)
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return { ...state, items: updatedItems };
      } else {
        return { ...state, items: [...state.items, action.payload] };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      return { ...state, items: updatedItems };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return { ...state, items: updatedItems };
    }
    
    case 'CLEAR_CART': {
      return initialState;
    }
    
    case 'CALCULATE_TOTALS': {
      const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const delivery_fee = state.items.reduce((sum, item) => {
        if (item.has_delivery && item.delivery_fee) {
          return sum + item.delivery_fee;
        }
        return sum;
      }, 0);
      const grand_total = total + delivery_fee;
      
      return { ...state, total, delivery_fee, grand_total };
    }
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity } });
    dispatch({ type: 'CALCULATE_TOTALS' });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    dispatch({ type: 'CALCULATE_TOTALS' });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
      dispatch({ type: 'CALCULATE_TOTALS' });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemCount = () => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
