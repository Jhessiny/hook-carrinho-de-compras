import axios from "axios";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      if (!productId) {
        toast.error("Erro na adição do produto");
        return;
      }
      const { data: stockAmount } = await axios.get(
        `http://localhost:3333/stock/${productId}`
      );
      const { data: addedProduct } = await axios.get(
        `http://localhost:3333/products/${productId}`
      );

      let copiedCart = Array.from(cart);
      const productInCart = copiedCart.find((prod) => prod.id === productId);
      if (productInCart) {
        const newAmount = productInCart.amount + 1;
        if (newAmount > stockAmount.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
        productInCart.amount = newAmount;
      } else {
        copiedCart = [...copiedCart, { ...addedProduct, amount: 1 }];
      }
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(copiedCart));
      setCart(copiedCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!productId) {
        toast.error("Erro na remoção do produto");
        return;
      }
      let copiedCart = Array.from(cart);
      const productInCart = copiedCart.find((prod) => prod.id === productId);
      if (productInCart)
        copiedCart = copiedCart.filter((item) => item.id !== productId);
      else {
        toast.error("Erro na remoção do produto");
        return;
      }
      copiedCart = copiedCart.filter((item) => item.id !== productId);
      setCart(copiedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(copiedCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (!productId || !amount) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      const { data: stock } = await axios.get(
        `http://localhost:3333/stock/${productId}`
      );
      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      let copiedCart = Array.from(cart);
      const productInCart = copiedCart.find((prod) => prod.id === productId);

      if (!productInCart) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      productInCart.amount = amount;
      setCart(copiedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(copiedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
