'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  User, 
  Calendar,
  Bed,
  Plus,
  Minus,
  Trash2,
  Save,
  Printer,
  ArrowLeft,
  Calculator,
  Hash,
  Clock,
  Check,
  X
} from 'lucide-react';

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  category: 'room' | 'service' | 'food' | 'amenity' | 'tax';
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const PaymentsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [showReceipt, setShowReceipt] = useState(false);
  
  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash', icon: DollarSign, enabled: true },
    { id: 'credit_card', name: 'Credit Card', icon: CreditCard, enabled: true },
    { id: 'debit_card', name: 'Debit Card', icon: CreditCard, enabled: true },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Receipt, enabled: true },
  ];

  const serviceCategories = [
    { id: 'room', name: 'Room Charges', color: 'bg-blue-100 text-blue-800' },
    { id: 'food', name: 'Food & Beverage', color: 'bg-green-100 text-green-800' },
    { id: 'service', name: 'Services', color: 'bg-purple-100 text-purple-800' },
    { id: 'amenity', name: 'Amenities', color: 'bg-orange-100 text-orange-800' },
    { id: 'tax', name: 'Taxes & Fees', color: 'bg-gray-100 text-gray-800' },
  ];

  const quickServices = [
    { name: 'Laundry Service', price: 150000, category: 'service' as const },
    { name: 'Room Service', price: 50000, category: 'service' as const },
    { name: 'Mini Bar', price: 75000, category: 'food' as const },
    { name: 'Breakfast', price: 125000, category: 'food' as const },
    { name: 'Spa Treatment', price: 350000, category: 'service' as const },
    { name: 'Airport Transfer', price: 200000, category: 'service' as const },
    { name: 'WiFi Premium', price: 25000, category: 'amenity' as const },
    { name: 'Late Checkout', price: 100000, category: 'service' as const },
  ];

  useEffect(() => {
    // Parse URL parameters
    const resId = searchParams.get('reservationId');
    const guest = searchParams.get('guest');
    const room = searchParams.get('room');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const amount = searchParams.get('amount');

    if (resId) setReservationId(resId);
    if (guest) setGuestName(guest);
    if (room) setRoomNumber(room);
    if (checkIn) setCheckInDate(checkIn);
    if (checkOut) setCheckOutDate(checkOut);
    
    if (amount) {
      const roomCharge: LineItem = {
        id: 'room-charge',
        name: `Room ${room} Charges`,
        quantity: 1,
        price: parseFloat(amount),
        total: parseFloat(amount),
        category: 'room'
      };
      setLineItems([roomCharge]);
      setPaymentAmount(parseFloat(amount));
    }
  }, [searchParams]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.11; // 11% tax
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const addLineItem = (service: { name: string; price: number; category: 'room' | 'service' | 'food' | 'amenity' }) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      name: service.name,
      quantity: 1,
      price: service.price,
      total: service.price,
      category: service.category
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeLineItem(id);
      return;
    }
    
    setLineItems(lineItems.map(item =>
      item.id === id
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStatus('completed');
      setShowReceipt(true);
    } catch (error) {
      setPaymentStatus('failed');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const calculateChange = () => {
    if (selectedPaymentMethod === 'cash' && cashReceived > 0) {
      return Math.max(0, cashReceived - totalAmount);
    }
    return 0;
  };

  return (
    <AppLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Page Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600 mt-1">Process payments and manage charges</p>
            </div>
            <div className="flex items-center space-x-3">
              {paymentStatus === 'completed' && (
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Guest Info & Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information Card */}
            {(guestName || roomNumber) && (
              <div className="bg-white shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Guest Information</h3>
                      <p className="text-sm text-gray-600 mt-1">Current reservation details</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Guest Name</p>
                      <p className="font-medium">{guestName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Room Number</p>
                      <p className="font-medium">{roomNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-medium">{checkInDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-medium">{checkOutDate || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Services */}
            <div className="bg-white shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quick Add Services</h3>
                    <p className="text-sm text-gray-600 mt-1">Add common hotel services and amenities</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickServices.map((service, index) => (
                    <button
                      key={index}
                      onClick={() => addLineItem(service)}
                      className="group p-3 bg-white border hover:border-[#005357] hover:bg-[#005357] hover:text-white hover:shadow-md transition-all text-left"
                    >
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-[#005357] group-hover:text-white font-bold text-sm mt-1">
                        {formatCurrency(service.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Order Summary & Payment */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
                    <p className="text-sm text-gray-600 mt-1">Current charges and fees</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {lineItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No items added</p>
                    </div>
                  ) : (
                    lineItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white border">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-gray-600 text-xs">
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="p-1 hover:bg-red-100 text-red-600 ml-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="font-bold text-sm ml-4 min-w-[80px] text-right">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                {lineItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (11%):</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-[#005357]">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            {lineItems.length > 0 && (
              <div className="bg-white shadow border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                      <p className="text-sm text-gray-600 mt-1">Select payment type</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`p-3 border flex flex-col items-center space-y-2 transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'border-[#005357] bg-[#005357] text-white'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{method.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash Payment Input */}
                  {selectedPaymentMethod === 'cash' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cash Received *
                        </label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          placeholder="Enter cash amount"
                        />
                      </div>
                      {cashReceived > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200">
                          <div className="flex justify-between text-sm">
                            <span>Change:</span>
                            <span className="font-bold text-green-700">
                              {formatCurrency(calculateChange())}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPaymentMethod || paymentStatus === 'processing' || paymentStatus === 'completed'}
                    className="w-full flex items-center justify-center px-6 py-4 bg-[#005357] text-white font-bold hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentStatus === 'processing' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing Payment...
                      </>
                    ) : paymentStatus === 'completed' ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Payment Completed
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Process Payment ({formatCurrency(totalAmount)})
                      </>
                    )}
                  </button>

                  {paymentStatus === 'failed' && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                      Payment failed. Please try again.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const PaymentsPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentsPage />
    </Suspense>
  );
};

export default PaymentsPageWithSuspense;