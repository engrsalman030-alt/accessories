import React, { useState, useEffect } from 'react';
import productService from '../services/api';
import customerService from '../services/customerService';
import saleService from '../services/saleService';
import { 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  TrashIcon, 
  CreditCardIcon, 
  PhotoIcon,
  CalculatorIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import CheckoutModal from '../components/sales/CheckoutModal';
import InvoicePrint from '../components/ui/InvoicePrint';
import SearchableSelect from '../components/ui/SearchableSelect';
import AddEditCustomerModal from '../components/customers/AddEditCustomerModal';

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
  const [discountType, setDiscountType] = useState('fixed'); // fixed, percentage
  const [amountPaid, setAmountPaid] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSaleData, setLastSaleData] = useState(null);

  const fetchCustomers = async () => {
    const res = await customerService.getAll({ size: 1000 });
    setCustomers(res.data?.items || res.data || []);
  };

  useEffect(() => {
    productService.get('/products?size=1000').then(res => setProducts(res.data?.items || res.data || []));
    fetchCustomers();
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
  const calculatedDiscount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
  const total = subtotal - calculatedDiscount;

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
        discount: calculatedDiscount,
        discount_type: discountType,
        discount_value: discount,
        total_amount: total,
        amount_paid,
        payment_method,
        items: cart.map(({ product_id, quantity, unit_price, name }) => ({ 
          product_id, quantity, unit_price, name 
        }))
      };

      const res = await saleService.create(saleData);
      
      if (res && res.data) {
        setLastSaleData({
          ...res.data,
          customer: selectedCustomer,
          items: cart.map(item => ({ ...item }))
        });

        setIsSuccess(true);
        toast.success('Sale completed successfully!');
        
        productService.get('/products?size=1000').then(res => {
          if (res && res.data) setProducts(res.data?.items || res.data || []);
        }).catch(err => console.error("Stock refresh failed", err));
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('Sale failed:', error);
      toast.error(`Sale failed: ${error.response?.data?.detail || error.message}`);
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
    <div className="flex gap-4 h-[calc(100vh-140px)] overflow-hidden">
      {/* 1. Product Selection Section (Left) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="card-premium p-2.5 flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1 group">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 transition-all text-[13px] font-bold dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[10px] outline-none focus:border-primary-500 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              <option value="">Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[10px] outline-none focus:border-primary-500 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              <option value="">Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max content-start pr-1 scrollbar-hide">
          {filteredProducts.map(product => {
            const customerType = selectedCustomer?.type || 'retail';
            const price = product[`${customerType}_price`] || product.retail_price;
            
            return (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="card-premium p-2 text-left hover:border-primary-500 transition-all group flex flex-col h-full active:scale-95 duration-200"
              >
                <div className="w-full h-20 mb-2 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-50 dark:border-slate-800">
                  {product.image_url ? (
                    <img src={`http://localhost:8000${product.image_url}`} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <PhotoIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between w-full">
                  <div>
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">{product.brand?.name || 'GENERIC'}</div>
                    <div className="text-[10px] font-black text-slate-800 dark:text-slate-200 group-hover:text-primary-600 truncate leading-tight uppercase tracking-tighter">{product.name}</div>
                  </div>
                  <div className="mt-1.5 flex justify-between items-end w-full">
                    <div className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">PKR {price.toFixed(0)}</div>
                    <div className={`text-[7px] font-black px-1 py-0.5 rounded-md uppercase tracking-tighter ${product.stock_qty > 10 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                      {product.stock_qty}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Order Cart Section (Middle) */}
      <div className="w-72 flex flex-col h-full">
        <div className="card-premium flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-4 h-4 text-primary-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Order Cart</span>
            </div>
            <span className="bg-primary-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">{cart.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {cart.map(item => (
              <div key={item.product_id} className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 group">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-slate-900 dark:text-white text-[10px] truncate uppercase tracking-tighter leading-none">{item.name}</div>
                  </div>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-rose-500 hover:scale-110 transition-transform flex-shrink-0">
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                   <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tabular-nums leading-none">
                    {item.unit_price.toFixed(0)} <span className="opacity-50">x</span> {item.quantity}
                   </div>
                   <div className="font-black text-slate-900 dark:text-white text-[10px] tabular-nums leading-none">
                    {(item.unit_price * item.quantity).toFixed(0)}
                   </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-30">
                <ShoppingCartIcon className="w-8 h-8" />
                <p className="text-[10px] font-black uppercase tracking-widest">Cart is empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Checkout & Pricing Section (Right) */}
      <div className="w-80 flex flex-col h-full">
        <div className="card-premium flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
             <div className="flex items-center gap-2">
                <CalculatorIcon className="w-4 h-4 text-primary-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Billing details</span>
             </div>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto scrollbar-hide">
            {/* Customer Selection */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Client profile</label>
                  <button 
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="flex items-center gap-1 text-[9px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-tighter"
                  >
                    <UserPlusIcon className="w-3 h-3" />
                    New client
                  </button>
               </div>
               <SearchableSelect 
                  options={customers}
                  value={selectedCustomer?.id || ''}
                  onChange={(val) => setSelectedCustomer(customers.find(c => c.id === parseInt(val)) || null)}
                  placeholder="Retail / Walk-in Customer"
                  className="!rounded-xl"
                />
            </div>

            {/* Calculations */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-black uppercase tracking-tighter">Gross Amount</span>
                  <span className="text-slate-900 dark:text-white font-black tabular-nums">PKR {subtotal.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-black uppercase tracking-tighter">Special Discount</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => setDiscountType('fixed')}
                        className={`px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all ${discountType === 'fixed' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        FIX
                      </button>
                      <button 
                        onClick={() => setDiscountType('percentage')}
                        className={`px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all ${discountType === 'percentage' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        %
                      </button>
                    </div>
                    <input 
                      type="number" 
                      value={discount} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-16 text-right font-black text-rose-600 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-rose-500 outline-none tabular-nums text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20 text-white space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Net payable amount</p>
                <p className="text-2xl font-black text-center tabular-nums">PKR {total.toFixed(0)}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-3 pt-2">
               <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Amount received</label>
               <div className="relative group">
                  <CreditCardIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    type="number" 
                    placeholder="Enter cash received..."
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary-500 font-black dark:text-white tabular-nums transition-all"
                  />
               </div>
            </div>

            <Button 
              variant="primary" 
              className="w-full h-14 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 transition-all active:scale-95"
              loading={isSubmitting}
              onClick={handleCheckout}
            >
              Confirm Invoice
            </Button>
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

      <AddEditCustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={fetchCustomers}
      />

      <InvoicePrint data={lastSaleData} type="sale" />
    </div>
  );
}
