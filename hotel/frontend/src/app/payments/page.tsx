'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

// Add print styles
const printStyles = `
  @media print {
    /* Hide everything */
    body * {
      visibility: hidden;
    }
    /* Show only receipt */
    .print-only, .print-only * {
      visibility: visible;
    }
    .print-only {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
    }
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  @media screen {
    .print-only {
      display: none;
    }
  }
`;
import {
  CreditCardIcon,
  File01Icon,
  UserIcon,
  Calendar01Icon,
  BedIcon,
  Add01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  PackageIcon,
  ChevronLeftIcon,
  Calculator,
  Hash,
  Clock01Icon,
  UserCheckIcon,
  Delete02Icon,
  Printer,
  MoreHorizontalIcon,
  Search02Icon
} from '@/lib/icons';

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

interface Transaction {
  id: number;
  reservation: number;
  reservation_number: string;
  amount: string;
  payment_method: string;
  payment_method_display: string;
  status: string;
  status_display: string;
  payment_date: string;
  transaction_id: string | null;
  notes: string;
}

const PaymentsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [openTransactionMenu, setOpenTransactionMenu] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);
  
  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash', icon: CreditCardIcon, enabled: true },
    { id: 'credit_card', name: 'Credit Card', icon: CreditCardIcon, enabled: true },
    { id: 'debit_card', name: 'Debit Card', icon: CreditCardIcon, enabled: true },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: File01Icon, enabled: true },
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

    if (resId) {
      setReservationId(resId);

      // First fetch to get reservation_number
      fetch(`http://localhost:8000/api/hotel/reservations/`)
        .then(res => res.json())
        .then(data => {
          const reservation = data.results?.find((r: any) => r.id === parseInt(resId));
          if (reservation?.reservation_number) {
            // Fetch full details with payment info
            return fetch(`http://localhost:8000/api/hotel/reservations/${reservation.reservation_number}/`);
          }
        })
        .then(res => res?.json())
        .then(fullData => {
          if (fullData?.is_fully_paid) {
            setIsAlreadyPaid(true);
          }
        })
        .catch(err => console.error('Error checking payment status:', err));
    }

    if (guest) setGuestName(guest);
    if (room) setRoomNumber(room);
    if (checkIn) setCheckInDate(checkIn);
    if (checkOut) setCheckOutDate(checkOut);

    // Load transactions when switching to history tab
    if (activeTab === 'history') {
      loadTransactions();
    }

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
  }, [searchParams, router, activeTab]);

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch('http://localhost:8000/api/hotel/payments/today_payments/');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.payments || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

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
      // Prepare payment data
      const paymentData = {
        reservation: reservationId,
        amount: totalAmount,
        payment_method: selectedPaymentMethod.toUpperCase().replace(' ', '_'),
        status: 'COMPLETED',
        notes: `Payment for ${guestName} - Room ${roomNumber}`,
      };

      // Create payment record in backend
      const response = await fetch('http://localhost:8000/api/hotel/payments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const paymentResult = await response.json();
      console.log('Payment created:', paymentResult);

      setPaymentStatus('completed');
      setShowReceipt(true);

      // Auto print receipt after a short delay
      setTimeout(() => {
        // Try silent print first (kiosk mode), fallback to standard print dialog
        if (typeof window !== 'undefined') {
          try {
            // For kiosk mode or browsers that support silent print
            window.print();
          } catch (e) {
            console.log('Standard print dialog opened');
          }
        }

        // Redirect to bookings page after printing
        setTimeout(() => {
          router.push('/bookings');
        }, 2000); // Increased delay to allow print to complete
      }, 500);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      alert('Payment failed. Please try again.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleReprintReceipt = (transaction: Transaction) => {
    // Set the transaction data to the receipt fields temporarily
    const tempLineItems = [{
      id: 'reprint-charge',
      name: `${transaction.notes || 'Payment'}`,
      quantity: 1,
      price: parseFloat(transaction.amount),
      total: parseFloat(transaction.amount),
      category: 'room' as const
    }];

    const tempSubtotal = parseFloat(transaction.amount) / 1.11;
    const tempTax = parseFloat(transaction.amount) - tempSubtotal;

    // Store current state
    const originalLineItems = lineItems;
    const originalGuest = guestName;
    const originalRoom = roomNumber;
    const originalMethod = selectedPaymentMethod;

    // Set reprint data
    setLineItems(tempLineItems);
    setGuestName(transaction.reservation_number);
    setRoomNumber('');
    setSelectedPaymentMethod(transaction.payment_method);

    // Print after a brief delay
    setTimeout(() => {
      window.print();

      // Restore original state
      setTimeout(() => {
        setLineItems(originalLineItems);
        setGuestName(originalGuest);
        setRoomNumber(originalRoom);
        setSelectedPaymentMethod(originalMethod);
      }, 100);
    }, 100);
  };

  const handleVoidTransaction = async (transaction: Transaction) => {
    if (!confirm(`Are you sure you want to void this transaction?\n\nReservation: ${transaction.reservation_number}\nAmount: ${formatCurrency(parseFloat(transaction.amount))}\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/hotel/payments/${transaction.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          notes: `${transaction.notes}\n[VOIDED on ${new Date().toLocaleString('id-ID')}]`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to void transaction');
      }

      alert('Transaction voided successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error voiding transaction:', error);
      alert('Failed to void transaction. Please try again.');
    }
  };

  const calculateChange = () => {
    if (selectedPaymentMethod === 'cash' && cashReceived > 0) {
      return Math.max(0, cashReceived - totalAmount);
    }
    return 0;
  };

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div>
        {/* Header */}
        <div className="mb-6 no-print">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'payment'
                  ? 'text-[#005357] border-b-2 border-[#005357]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment Entry
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-[#005357] border-b-2 border-[#005357]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transaction History
            </button>
          </div>

          {/* Page Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600 mt-1">Process payments and manage charges</p>
            </div>
            <div className="flex items-center space-x-3 no-print">
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

        {/* Payment Entry Tab */}
        {activeTab === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
            {/* Left Panel - Guest Info & Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information Card */}
            {(guestName || roomNumber) && (
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Guest Information</h3>
                      <p className="text-sm text-gray-600 mt-1">Current reservation details</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
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
            <div className="bg-white border border-gray-200 no-print">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quick Add Services</h3>
                    <p className="text-sm text-gray-600 mt-1">Add common hotel services and amenities</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <Add01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickServices.map((service, index) => (
                    <button
                      key={index}
                      onClick={() => addLineItem(service)}
                      className="group p-3 bg-white border hover:border-[#005357] hover:bg-[#005357] hover:text-white hover:border-gray-400 transition-all text-left"
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
          <div className="space-y-6 no-print">
            {/* Order Summary */}
            <div className="bg-white border border-gray-200 border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
                    <p className="text-sm text-gray-600 mt-1">Current charges and fees</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <File01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {lineItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <File01Icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
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
                            <Cancel01Icon className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600"
                          >
                            <Add01Icon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="p-1 hover:bg-red-100 text-red-600 ml-2"
                          >
                            <Delete02Icon className="h-3 w-3" />
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
              <div className="bg-white border border-gray-200 border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                      <p className="text-sm text-gray-600 mt-1">Select payment type</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <CreditCardIcon className="h-4 w-4 text-white" />
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

                  {/* Already Paid Alert */}
                  {isAlreadyPaid && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
                      <strong>✓ This reservation is already fully paid!</strong>
                      <p className="mt-1 text-xs">No additional payment needed.</p>
                    </div>
                  )}

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPaymentMethod || paymentStatus === 'processing' || paymentStatus === 'completed' || isAlreadyPaid}
                    className="w-full flex items-center justify-center px-6 py-4 bg-[#005357] text-white font-bold hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAlreadyPaid ? (
                      <>
                        <UserCheckIcon className="h-5 w-5 mr-2" />
                        Already Paid
                      </>
                    ) : paymentStatus === 'processing' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing Payment...
                      </>
                    ) : paymentStatus === 'completed' ? (
                      <>
                        <UserCheckIcon className="h-5 w-5 mr-2" />
                        Payment Completed
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="h-5 w-5 mr-2" />
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
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="no-print">
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Today's Transactions</h3>
                    <p className="text-sm text-gray-600 mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search02Icon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingTransactions ? (
                  <div className="p-8 text-center text-gray-500">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No transactions found</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions
                        .filter(transaction => {
                          if (!searchQuery) return true;
                          const search = searchQuery.toLowerCase();
                          return (
                            transaction.reservation_number.toLowerCase().includes(search) ||
                            transaction.notes.toLowerCase().includes(search) ||
                            transaction.payment_method_display.toLowerCase().includes(search)
                          );
                        })
                        .map((transaction) => {
                          // Extract guest name from notes (format: "Payment for [Guest Name] - Room [Number]")
                          const guestMatch = transaction.notes.match(/Payment for (.+?) - Room/);
                          const guestName = guestMatch ? guestMatch[1] : '-';

                          return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.reservation_number}
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.payment_date).toLocaleDateString('id-ID')} {new Date(transaction.payment_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{guestName}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(parseFloat(transaction.amount))}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{transaction.payment_method_display}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status_display}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            <div className="relative flex justify-center">
                              <button
                                onClick={() => setOpenTransactionMenu(openTransactionMenu === transaction.id ? null : transaction.id)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                              >
                                <MoreHorizontalIcon className="h-5 w-5" />
                              </button>

                              {openTransactionMenu === transaction.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10 top-full">
                                  <button
                                    onClick={() => {
                                      handleReprintReceipt(transaction);
                                      setOpenTransactionMenu(null);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                  >
                                    <Printer className="h-4 w-4" />
                                    <span>Reprint Receipt</span>
                                  </button>
                                  {transaction.status === 'COMPLETED' && (
                                    <button
                                      onClick={() => {
                                        handleVoidTransaction(transaction);
                                        setOpenTransactionMenu(null);
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                    >
                                      <Cancel01Icon className="h-4 w-4" />
                                      <span>Void Transaction</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Print-only Receipt */}
        <div className="print-only" style={{ maxWidth: '80mm', margin: '0 auto', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>LADAPALA HOTEL</h1>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>Jl. Hotel Mewah No. 123</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>Jakarta, Indonesia</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>Tel: (021) 123-4567</p>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '14px' }}>
            <p style={{ margin: '5px 0' }}><strong>PAYMENT RECEIPT</strong></p>
            <p style={{ margin: '5px 0' }}>Date: {new Date().toLocaleDateString('id-ID')}</p>
            <p style={{ margin: '5px 0' }}>Time: {new Date().toLocaleTimeString('id-ID')}</p>
            <p style={{ margin: '5px 0' }}>Receipt #: {reservationId}</p>
          </div>

          <div style={{ marginBottom: '20px', borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '14px' }}>
            <p style={{ margin: '5px 0' }}><strong>Guest:</strong> {guestName}</p>
            <p style={{ margin: '5px 0' }}><strong>Room:</strong> {roomNumber}</p>
            <p style={{ margin: '5px 0' }}><strong>Check-in:</strong> {checkInDate}</p>
            <p style={{ margin: '5px 0' }}><strong>Check-out:</strong> {checkOutDate}</p>
          </div>

          <div style={{ marginBottom: '20px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '5px 0' }}>Item</th>
                  <th style={{ textAlign: 'right', padding: '5px 0' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '5px 0' }}>
                      {item.name}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 0' }}>
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '1px solid #000', paddingTop: '10px', marginBottom: '20px', fontSize: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Tax (11%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '10px' }}>
              <span>TOTAL:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '14px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <p style={{ margin: '5px 0' }}><strong>Payment Method:</strong> {selectedPaymentMethod.replace('_', ' ').toUpperCase()}</p>
            {selectedPaymentMethod === 'cash' && cashReceived > 0 && (
              <>
                <p style={{ margin: '5px 0' }}><strong>Cash Received:</strong> {formatCurrency(cashReceived)}</p>
                <p style={{ margin: '5px 0' }}><strong>Change:</strong> {formatCurrency(calculateChange())}</p>
              </>
            )}
            <p style={{ margin: '5px 0' }}><strong>Status:</strong> PAID</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', borderTop: '2px solid #000', paddingTop: '10px' }}>
            <p style={{ margin: '5px 0' }}>Thank you for staying with us!</p>
            <p style={{ margin: '5px 0' }}>Visit us again soon</p>
            <p style={{ margin: '10px 0 5px 0' }}>** This is a computer-generated receipt **</p>
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