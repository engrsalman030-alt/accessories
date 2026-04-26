import React, { useState, useEffect } from 'react';
import productService from '../services/api';
import customerService from '../services/customerService';
import saleService from '../services/saleService';
import { 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  TrashIcon, 
  CreditCardIcon, 
  PhotoIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import CheckoutModal from '../components/sales/CheckoutModal';
import InvoicePrint from '../components/ui/InvoicePrint';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSaleData, setLastSaleData] = useState(null);

  useEffect(() => {
    productService.get('/products').then(res => setProducts(res.data));
    customerService.getAll().then(res => setCustomers(res.data));
    productService.get('/categories').then(res => setCategories(res.data));
    productService.get('/brands').then(res => setBrands(res.data));
  }, []);

  // Update cart prices when customer type changes
  useEffect(() => {
    if (cart.length === 0) return;
    const customerType = selectedCustomer?.type || 'retail';
    setCart(prev => prev.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        return { ...item, unit_price: product[`${customerType}_price`] || product.retail_price };
      }
      return item;
    }));
  }, [selectedCustomer, products, cart.length]);

  const addToCart = (product) => {
    if (product.stock_qty <= 0) return toast.error('Product out of stock!');
    const existing = cart.find(item => item.product_id === product.id);
    
    // Determine the price based on customer type
    const customerType = selectedCustomer?.type || 'retail';
    const price = product[`${customerType}_price`] || product.retail_price;

    if (existing) {
      if (existing.quantity >= product.stock_qty) return toast.error('Cannot exceed available stock!');
      setCart(cart.map(item => 
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1, unit_price: price } : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        name: product.name, 
        quantity: 1, 
        unit_price: price,
        stock_qty: product.stock_qty 
      }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.product_id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal - discount;

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error('Cart is empty!');
    setShowCheckout(true);
  };

  const handleConfirmSale = async ({ amount_paid, payment_method }) => {
    setIsSubmitting(true);
    try {
      const saleData = {
        customer_id: selectedCustomer?.id || null,
        customer_type: selectedCustomer?.type || 'retail',
        subtotal,
        discount,
        total_amount: total,
        amount_paid,
        payment_method,
        items: cart.map(({ product_id, quantity, unit_price, name }) => ({ 
          product_id, quantity, unit_price, name 
        }))
      };

      const res = await saleService.create(saleData);
      
      setLastSaleData({
        ...res.data,
        customer: selectedCustomer,
        items: cart.map(item => ({ ...item }))
      });

      setIsSuccess(true);
      toast.success('Sale completed successfully!');
      
      // Refresh products for stock
      productService.get('/products').then(res => setProducts(res.data));
    } catch (error) {
      console.error('Sale failed:', error);
      toast.error('Sale failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setAmountPaid(0);
    setShowCheckout(false);
    setIsSuccess(false);
    setLastSaleData(null);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.barcode?.includes(searchTerm) ||
                         p.imei?.includes(searchTerm) ||
                         p.sku?.includes(searchTerm);
    const matchesCategory = selectedCategory === '' || p.category_id === parseInt(selectedCategory);
    const matchesBrand = selectedBrand === '' || p.brand_id === parseInt(selectedBrand);
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="card-premium p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary-500 font-bold text-slate-600 dark:text-slate-300"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary-500 font-bold text-slate-600 dark:text-slate-300"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max content-start pr-2 scrollbar-hide">
          {filteredProducts.map(product => {
            const customerType = selectedCustomer?.type || 'retail';
            const price = product[`${customerType}_price`] || product.retail_price;
            
            return (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="card-premium p-4 text-left hover:border-primary-500 transition-all group flex flex-col h-full"
              >
                {/* Image Section */}
                <div className="w-full h-32 mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {product.image_url ? (
                    <img src={`http://localhost:8000${product.image_url}`} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                
                {/* Details Section */}
                <div className="flex-1 flex flex-col justify-between w-full">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{product.category?.name || 'Item'}</div>
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 truncate">{product.name}</div>
                  </div>
                  <div className="mt-3 flex justify-between items-end w-full">
                    <div className="text-xl font-black text-slate-900 dark:text-white">PKR {price.toFixed(2)}</div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${product.stock_qty > 10 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                      Stock: {product.stock_qty}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart and Checkout Area */}
      <div className="w-96 flex flex-col gap-6">
        <div className="card-premium flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-primary-600" />
              <span className="font-bold text-slate-900 dark:text-white">Current Order</span>
            </div>
            <span className="bg-primary-600 text-white text-xs font-black px-2 py-1 rounded-full">{cart.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map(item => (
              <div key={item.product_id} className="flex gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 group">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">PKR {item.unit_price} x {item.quantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-black text-slate-900 dark:text-white text-sm">PKR {(item.unit_price * item.quantity).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                <ShoppingCartIcon className="w-12 h-12" />
                <p className="font-bold">Cart is empty</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Subtotal</span>
                <span className="text-slate-900 dark:text-white font-black">PKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Discount</span>
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right font-black text-rose-600 bg-transparent border-b border-dashed border-slate-300 focus:border-rose-500 outline-none"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white font-black text-lg">Total</span>
                <span className="text-primary-600 font-black text-2xl">PKR {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Customer</label>
                <select 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 dark:text-white"
                  onChange={(e) => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)) || null)}
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Amount Paid</label>
                <div className="relative">
                  <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    placeholder="Cash/Card received..."
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary-500 font-black dark:text-white"
                  />
                </div>
              </div>
              <Button 
                variant="primary" 
                className="w-full h-14 rounded-2xl text-lg font-black"
                loading={isSubmitting}
                onClick={handleCheckout}
              >
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <CheckoutModal 
        isOpen={showCheckout}
        onClose={handleReset}
        total={total}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        onConfirm={handleConfirmSale}
      />

      <InvoicePrint data={lastSaleData} type="sale" />
    </div>
  );
}
