'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';

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
  Clock01Icon,
  UserCheckIcon,
  Delete02Icon,
  MoreHorizontalIcon,
  Search02Icon,
  PrinterIcon
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
  guest_name: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  amount: string;
  subtotal: string;
  payment_method: string;
  payment_method_display: string;
  status: string;
  status_display: string;
  payment_date: string;
  transaction_id: string | null;
  notes: string;
  // Promotion fields
  voucher_code: string | null;
  voucher_name: string | null;
  voucher_discount: string;
  discount_name: string | null;
  discount_type: string | null;
  discount_amount: string;
  loyalty_points_redeemed: number;
  loyalty_points_value: string;
  loyalty_points_earned: number;
  total_discount: string;
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
  const [cardNumber, setCardNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);

  // Manager authorization modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [pendingVoidTransaction, setPendingVoidTransaction] = useState<Transaction | null>(null);

  // Promotion states
  const [voucherCode, setVoucherCode] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash', icon: CreditCardIcon, enabled: true },
    { id: 'debit_credit', name: 'Debit/Credit Card', icon: CreditCardIcon, enabled: true },
    { id: 'qris', name: 'QRIS', icon: PackageIcon, enabled: true },
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

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(buildApiUrl('hotel/payments/today_payments/'));
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

  // Fetch CSRF token on mount
  useEffect(() => {
    fetch(buildApiUrl('user/csrf/'), {
      credentials: 'include'
    }).catch(err => console.error('Error fetching CSRF token:', err));
  }, []);

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
      fetch(buildApiUrl('hotel/reservations/'))
        .then(res => res.json())
        .then(data => {
          const reservation = data.results?.find((r: any) => r.id === parseInt(resId));
          if (reservation?.reservation_number) {
            // Fetch guest loyalty points if guest ID is available
            if (reservation.guest) {
              fetchGuestLoyaltyPoints(reservation.guest);
            }
            // Fetch full details with payment info
            return fetch(buildApiUrl(`hotel/reservations/${reservation.reservation_number}/`));
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
  }, [searchParams, router]);

  // Separate useEffect for loading transactions when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  // Fetch guest loyalty points
  const fetchGuestLoyaltyPoints = async (guestId: number) => {
    try {
      const response = await fetch(buildApiUrl(`hotel/guests/${guestId}/`));
      if (response.ok) {
        const data = await response.json();
        setAvailablePoints(data.loyalty_points || 0);
      }
    } catch (error) {
      console.error('Error fetching guest loyalty points:', error);
      setAvailablePoints(0);
    }
  };

  // Calculate payment with promotions
  const calculateWithPromotions = async () => {
    if (!reservationId) return;

    setApplyingVoucher(true);
    setVoucherError('');

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('hotel/payments/calculate/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: reservationId,
          voucher_code: voucherCode || undefined,
          redeem_points: pointsToRedeem || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setVoucherError(data.error || 'Failed to calculate promotions');
        setCalculationResult(null);
      } else {
        setCalculationResult(data);
        setVoucherError('');
      }
    } catch (error) {
      console.error('Error calculating promotions:', error);
      setVoucherError('Network error occurred');
      setCalculationResult(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Apply voucher button handler
  const handleApplyVoucher = () => {
    if (!voucherCode.trim() && pointsToRedeem === 0) {
      setVoucherError('Please enter a voucher code or points to redeem');
      return;
    }
    calculateWithPromotions();
  };

  // Clear promotions
  const handleClearPromotions = () => {
    setVoucherCode('');
    setPointsToRedeem(0);
    setCalculationResult(null);
    setVoucherError('');
  };

  const handlePayment = async () => {
    setPaymentStatus('processing');

    try {
      // Prepare payment data
      let notes = `Payment for ${guestName} - Room ${roomNumber}`;
      if (selectedPaymentMethod === 'debit_credit' && cardNumber) {
        // Mask card number, show only last 4 digits
        const maskedCard = `****-****-****-${cardNumber.slice(-4)}`;
        notes += ` | Card: ${maskedCard}`;
      }

      // Map frontend payment methods to backend values
      const paymentMethodMap: { [key: string]: string } = {
        'cash': 'CASH',
        'debit_credit': 'CREDIT_CARD',
        'qris': 'DIGITAL_WALLET'
      };

      let response;
      let paymentResult;

      // Use process_with_promotions endpoint if promotions are applied
      if (calculationResult && (voucherCode || pointsToRedeem > 0)) {
        const promotionData = {
          reservation_id: reservationId,
          payment_method: paymentMethodMap[selectedPaymentMethod] || 'CASH',
          transaction_id: null,
          voucher_code: voucherCode || undefined,
          redeem_points: pointsToRedeem || 0,
        };

        const csrfToken = getCsrfToken();
        response = await fetch(buildApiUrl('hotel/payments/process_with_promotions/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRFToken': csrfToken }),
          },
          credentials: 'include',
          body: JSON.stringify(promotionData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment with promotions failed');
        }

        const data = await response.json();
        paymentResult = data.payment;
        console.log('Payment with promotions created:', paymentResult);
      } else {
        // Standard payment without promotions
        const paymentData = {
          reservation: reservationId,
          amount: totalAmount,
          payment_method: paymentMethodMap[selectedPaymentMethod] || 'CASH',
          status: 'COMPLETED',
          payment_date: new Date().toISOString(),
          notes: notes,
        };

        response = await fetch(buildApiUrl('hotel/payments/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          throw new Error('Payment failed');
        }

        paymentResult = await response.json();
        console.log('Payment created:', paymentResult);
      }

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

  const handleVoidTransaction = (transaction: Transaction) => {
    setPendingVoidTransaction(transaction);
    setShowAuthModal(true);
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
    setVoidReason('');
  };

  const handleAuthSubmit = async () => {
    if (!authEmail || !authPassword) {
      setAuthError('Please enter email and password');
      return;
    }

    if (!voidReason || voidReason.trim().length < 10) {
      setAuthError('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      // Get CSRF token first
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      // Authenticate manager
      const authResponse = await fetch(buildApiUrl('user/login/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });

      if (!authResponse.ok) {
        setAuthError('Invalid credentials');
        return;
      }

      const authData = await authResponse.json();

      // Check if user is from Management department with Active employment status
      if (!authData.employee || authData.employee.department?.name !== 'Management') {
        setAuthError('Only employees from Management department can void transactions');
        return;
      }

      if (authData.employee.employment_status !== 'ACTIVE') {
        setAuthError('Only active employees can void transactions');
        return;
      }

      // Proceed with voiding the transaction
      if (!pendingVoidTransaction) return;

      const response = await fetch(buildApiUrl(`hotel/payments/${pendingVoidTransaction.id}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          notes: `${pendingVoidTransaction.notes}\n[VOIDED on ${new Date().toLocaleString('id-ID')} by ${authData.employee.full_name}]\nReason: ${voidReason}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to void transaction');
      }

      alert('Transaction voided successfully');
      setShowAuthModal(false);
      setPendingVoidTransaction(null);
      setAuthEmail('');
      setAuthPassword('');
      setAuthError('');
      setVoidReason('');
      loadTransactions();
    } catch (error) {
      console.error('Error voiding transaction:', error);
      setAuthError('Failed to void transaction. Please try again.');
    }
  };

  const calculateChange = () => {
    if (selectedPaymentMethod === 'cash' && cashReceived > 0) {
      const finalTotal = calculationResult ? parseFloat(calculationResult.final_amount) : totalAmount;
      return Math.max(0, cashReceived - finalTotal);
    }
    return 0;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <AppLayout>
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
                  <PrinterIcon className="h-4 w-4" />
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

            {/* Apply Voucher Code */}
            <div className="bg-white border border-gray-200 no-print">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Apply Voucher or Discount</h3>
                    <p className="text-sm text-gray-600 mt-1">Enter promo code to get discount</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500 flex items-center justify-center">
                    <PackageIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter voucher code (e.g. WELCOME2025)"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:outline-none uppercase"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher || !reservationId}
                      className="px-6 py-2 bg-[#005357] text-white font-medium hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingVoucher ? 'Applying...' : 'Apply'}
                    </button>
                    {calculationResult && (
                      <button
                        onClick={handleClearPromotions}
                        className="px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {voucherError && (
                    <p className="text-xs text-red-600">{voucherError}</p>
                  )}
                  {calculationResult && calculationResult.voucher?.code && (
                    <p className="text-xs text-green-600">
                      ✓ Voucher "{calculationResult.voucher.code}" applied: {formatCurrency(parseFloat(calculationResult.voucher.discount))}
                    </p>
                  )}
                  {calculationResult && calculationResult.auto_discount?.name && (
                    <p className="text-xs text-purple-600">
                      ✓ Auto discount "{calculationResult.auto_discount.name}" applied: {formatCurrency(parseFloat(calculationResult.auto_discount.discount))}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Valid voucher codes will be applied automatically to your total</p>
                </div>
              </div>
            </div>

            {/* Redeem Loyalty Points - For Returning Guests */}
            <div className="bg-white border border-gray-200 no-print">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Redeem Loyalty Points</h3>
                    <p className="text-sm text-gray-600 mt-1">For returning guests with reward points</p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500 flex items-center justify-center">
                    <UserCheckIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Available Points</span>
                      <span className="text-xl font-bold text-yellow-700">{availablePoints.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points to Redeem
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="0"
                        max={availablePoints}
                        value={pointsToRedeem || ''}
                        onChange={(e) => setPointsToRedeem(parseInt(e.target.value) || 0)}
                        placeholder="Enter points amount"
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:outline-none"
                      />
                      <button
                        onClick={handleApplyVoucher}
                        disabled={applyingVoucher || !reservationId || pointsToRedeem === 0}
                        className="px-6 py-2 bg-[#005357] text-white font-medium hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applyingVoucher ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">1,000 points = Rp 50,000 discount</p>
                    {calculationResult && calculationResult.loyalty_points?.redeemed > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ✓ {calculationResult.loyalty_points.redeemed.toLocaleString()} points redeemed: {formatCurrency(parseFloat(calculationResult.loyalty_points.value))}
                      </p>
                    )}
                  </div>
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

                    {/* Promotions/Discounts */}
                    {calculationResult && calculationResult.voucher?.discount && parseFloat(calculationResult.voucher.discount) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Voucher Discount ({calculationResult.voucher.code}):</span>
                        <span>- {formatCurrency(parseFloat(calculationResult.voucher.discount))}</span>
                      </div>
                    )}
                    {calculationResult && calculationResult.auto_discount?.discount && parseFloat(calculationResult.auto_discount.discount) > 0 && (
                      <div className="flex justify-between text-sm text-purple-600">
                        <span>Auto Discount ({calculationResult.auto_discount.name}):</span>
                        <span>- {formatCurrency(parseFloat(calculationResult.auto_discount.discount))}</span>
                      </div>
                    )}
                    {calculationResult && calculationResult.loyalty_points?.value && parseFloat(calculationResult.loyalty_points.value) > 0 && (
                      <div className="flex justify-between text-sm text-yellow-600">
                        <span>Points Redeemed ({calculationResult.loyalty_points.redeemed.toLocaleString()}):</span>
                        <span>- {formatCurrency(parseFloat(calculationResult.loyalty_points.value))}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-[#005357]">
                        {calculationResult ? formatCurrency(calculationResult.final_amount) : formatCurrency(totalAmount)}
                      </span>
                    </div>

                    {/* Points to Earn */}
                    {calculationResult && calculationResult.loyalty_points?.to_earn > 0 && (
                      <div className="p-2 bg-blue-50 border border-blue-200 text-center mt-2">
                        <p className="text-xs text-blue-700">You will earn</p>
                        <p className="text-sm font-bold text-blue-800">+{calculationResult.loyalty_points.to_earn.toLocaleString()} points</p>
                      </div>
                    )}
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

                  {/* Debit/Credit Card Input */}
                  {selectedPaymentMethod === 'debit_credit' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => {
                            // Only allow numbers and limit to 16 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setCardNumber(value);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          placeholder="Enter card number (16 digits)"
                          maxLength={16}
                        />
                        {cardNumber.length > 0 && cardNumber.length < 16 && (
                          <p className="text-xs text-red-600 mt-1">
                            Card number must be 16 digits ({cardNumber.length}/16)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* QRIS Payment Info */}
                  {selectedPaymentMethod === 'qris' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 border border-blue-200 text-center">
                        <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 flex items-center justify-center mb-3">
                          <div className="text-gray-400 text-sm">QR Code</div>
                        </div>
                        <p className="text-sm text-blue-700 font-medium">
                          Scan QR code with your mobile banking app
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Amount: {formatCurrency(calculationResult ? parseFloat(calculationResult.final_amount) : totalAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Already Paid Alert */}
                  {isAlreadyPaid && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
                      <strong>✓ This reservation is already fully paid!</strong>
                      <p className="mt-1 text-xs">No additional payment needed.</p>
                    </div>
                  )}

                  {/* Validation Messages */}
                  {!isAlreadyPaid && selectedPaymentMethod === 'cash' && cashReceived <= 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                      ⚠ Please enter the cash amount received
                    </div>
                  )}
                  {!isAlreadyPaid && selectedPaymentMethod === 'debit_credit' && cardNumber.length < 16 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                      ⚠ Please enter a valid 16-digit card number
                    </div>
                  )}
                  {!isAlreadyPaid && selectedPaymentMethod === 'qris' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                      ✓ Ready to process QRIS payment
                    </div>
                  )}

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={
                      !selectedPaymentMethod ||
                      paymentStatus === 'processing' ||
                      paymentStatus === 'completed' ||
                      isAlreadyPaid ||
                      (selectedPaymentMethod === 'cash' && cashReceived <= 0) ||
                      (selectedPaymentMethod === 'debit_credit' && cardNumber.length !== 16)
                    }
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
                        Process Payment ({formatCurrency(calculationResult ? parseFloat(calculationResult.final_amount) : totalAmount)})
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
            {calculationResult && calculationResult.voucher?.discount && parseFloat(calculationResult.voucher.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#16a34a' }}>
                <span>Voucher ({calculationResult.voucher.code}):</span>
                <span>-{formatCurrency(parseFloat(calculationResult.voucher.discount))}</span>
              </div>
            )}
            {calculationResult && calculationResult.auto_discount?.discount && parseFloat(calculationResult.auto_discount.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#9333ea' }}>
                <span>Discount ({calculationResult.auto_discount.name}):</span>
                <span>-{formatCurrency(parseFloat(calculationResult.auto_discount.discount))}</span>
              </div>
            )}
            {calculationResult && calculationResult.loyalty_points?.value && parseFloat(calculationResult.loyalty_points.value) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ca8a04' }}>
                <span>Points ({calculationResult.loyalty_points.redeemed}):</span>
                <span>-{formatCurrency(parseFloat(calculationResult.loyalty_points.value))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '10px' }}>
              <span>TOTAL:</span>
              <span>{formatCurrency(calculationResult ? parseFloat(calculationResult.final_amount) : totalAmount)}</span>
            </div>
            {calculationResult && calculationResult.loyalty_points?.to_earn > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px', color: '#2563eb' }}>
                <span>Points Earned:</span>
                <span>+{calculationResult.loyalty_points.to_earn.toLocaleString()} pts</span>
              </div>
            )}
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

      {/* Transaction History Table - Outside wrapper div */}
      {activeTab === 'history' && (
        <div className="no-print mt-6 px-6">
          <div className="bg-white border border-gray-200 overflow-visible">
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
            <div className="overflow-x-auto overflow-y-visible">
              {loadingTransactions ? (
                <div className="p-8 text-center text-gray-500">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No transactions found</div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservation</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotions</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="border border-gray-300 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(transaction => {
                        if (!searchQuery) return true;
                        const search = searchQuery.toLowerCase();
                        return (
                          transaction.reservation_number.toLowerCase().includes(search) ||
                          transaction.guest_name?.toLowerCase().includes(search) ||
                          transaction.notes.toLowerCase().includes(search) ||
                          transaction.payment_method_display.toLowerCase().includes(search)
                        );
                      })
                      .map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">
                          {transaction.reservation_number}
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.payment_date).toLocaleDateString('id-ID')} {new Date(transaction.payment_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{transaction.guest_name || '-'}</td>
                        <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{transaction.room_number || '-'}</td>
                        <td className="border border-gray-200 px-6 py-4 text-sm text-gray-600">
                          {transaction.check_in_date ? new Date(transaction.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 text-sm font-medium text-gray-900">
                          <div>
                            {formatCurrency(parseFloat(transaction.amount))}
                            {parseFloat(transaction.total_discount) > 0 && (
                              <div className="text-xs text-green-600 font-normal mt-1">
                                ({formatCurrency(parseFloat(transaction.total_discount))} discount)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-6 py-4 text-sm text-gray-600">
                          {parseFloat(transaction.total_discount) > 0 ? (
                            <div className="space-y-1">
                              {transaction.voucher_code && (
                                <div className="flex items-center space-x-1">
                                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                                    {transaction.voucher_code}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    -{formatCurrency(parseFloat(transaction.voucher_discount))}
                                  </span>
                                </div>
                              )}
                              {transaction.discount_name && (
                                <div className="flex items-center space-x-1">
                                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                                    {transaction.discount_name}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    -{formatCurrency(parseFloat(transaction.discount_amount))}
                                  </span>
                                </div>
                              )}
                              {transaction.loyalty_points_redeemed > 0 && (
                                <div className="flex items-center space-x-1">
                                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                                    {transaction.loyalty_points_redeemed.toLocaleString()} pts
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    -{formatCurrency(parseFloat(transaction.loyalty_points_value))}
                                  </span>
                                </div>
                              )}
                              {transaction.loyalty_points_earned > 0 && (
                                <div className="text-xs text-blue-600">
                                  +{transaction.loyalty_points_earned.toLocaleString()} pts earned
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 text-sm text-gray-600">{transaction.payment_method_display}</td>
                        <td className="border border-gray-200 px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status_display}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-6 py-4 text-right text-sm relative">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setOpenTransactionMenu(openTransactionMenu === transaction.id ? null : transaction.id)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                            >
                              <MoreHorizontalIcon className="h-5 w-5" />
                            </button>

                            {openTransactionMenu === transaction.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-50 top-full">
                                <button
                                  onClick={() => {
                                    handleReprintReceipt(transaction);
                                    setOpenTransactionMenu(null);
                                  }}
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                >
                                  <PrinterIcon className="h-4 w-4" />
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
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      </AppLayout>

      {/* Manager Authorization Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Manager Authorization Required</h3>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setPendingVoidTransaction(null);
                    setAuthEmail('');
                    setAuthPassword('');
                    setAuthError('');
                    setVoidReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Cancel01Icon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Voiding a transaction requires manager or administrator approval
              </p>
            </div>

            <div className="p-6 space-y-4">
              {pendingVoidTransaction && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-gray-900">Transaction to void:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Reservation: {pendingVoidTransaction.reservation_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {formatCurrency(parseFloat(pendingVoidTransaction.amount))}
                  </p>
                </div>
              )}

              {authError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Email *
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  placeholder="manager@example.com"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Void Reason *
                </label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAuthSubmit();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  placeholder="Please provide a detailed reason for voiding this transaction (minimum 10 characters)"
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters. Press Ctrl+Enter to submit.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingVoidTransaction(null);
                  setAuthEmail('');
                  setAuthPassword('');
                  setAuthError('');
                  setVoidReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthSubmit}
                className="px-4 py-2 bg-[#005357] text-white font-medium rounded-lg hover:bg-[#004449] transition-colors"
              >
                Authorize & Void
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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