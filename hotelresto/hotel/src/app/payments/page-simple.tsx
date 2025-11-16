'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  CreditCardIcon,
  File01Icon,
  UserIcon,
  Calendar01Icon,
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  Alert01Icon,
  SparklesIcon,
} from '@/lib/icons';

interface PaymentCalculation {
  success: boolean;
  error?: string;
  error_type?: string;
  subtotal: string;
  voucher: {
    code: string | null;
    name: string | null;
    discount: string;
  };
  auto_discount: {
    name: string | null;
    type: string | null;
    discount: string;
  };
  loyalty_points: {
    redeemed: number;
    value: string;
    to_earn: number;
  };
  final_amount: string;
  total_discount: string;
  breakdown: {
    reservation_number: string;
    guest_name: string;
    room: string | null;
    check_in: string;
    check_out: string;
    nights: number;
  };
}

interface GuestLoyaltyPoints {
  current_points: number;
  lifetime_points: number;
  tier: string;
}

const PaymentWithPromotionsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Basic payment info
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [baseAmount, setBaseAmount] = useState<number>(0);

  // Promotions state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherValidating, setVoucherValidating] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [availablePoints, setAvailablePoints] = useState<GuestLoyaltyPoints | null>(null);

  // Calculation result
  const [calculation, setCalculation] = useState<PaymentCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  const paymentMethods = [
    { id: 'CASH', name: 'Cash', icon: CreditCardIcon },
    { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCardIcon },
    { id: 'DIGITAL_WALLET', name: 'QRIS / E-Wallet', icon: CreditCardIcon },
  ];

  // Fetch reservation details from URL
  useEffect(() => {
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
    if (amount) setBaseAmount(parseFloat(amount));

    // Fetch guest loyalty points if reservation exists
    if (resId) {
      fetchGuestLoyaltyPoints(resId);
    }
  }, [searchParams]);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (reservationId) {
      calculatePayment();
    }
  }, [reservationId, voucherCode, pointsToRedeem]);

  const fetchGuestLoyaltyPoints = async (resId: string) => {
    try {
      // First get guest ID from reservation
      const resResponse = await fetch(buildApiUrl(`hotel/reservations/?id=${resId}`), {
        credentials: 'include',
      });
      const resData = await resResponse.json();
      const reservation = resData.results?.[0];

      if (reservation?.guest) {
        // Fetch loyalty points for this guest
        const pointsResponse = await fetch(
          buildApiUrl(`hotel/loyalty-points/by_guest/?guest_id=${reservation.guest}`),
          { credentials: 'include' }
        );
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setAvailablePoints(pointsData);
        }
      }
    } catch (error) {
      console.error('Error fetching loyalty points:', error);
    }
  };

  const calculatePayment = async () => {
    if (!reservationId) return;

    setCalculating(true);
    setVoucherError('');

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('hotel/payments/calculate/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: parseInt(reservationId),
          voucher_code: voucherCode || null,
          redeem_points: pointsToRedeem || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCalculation(data);
      } else {
        setVoucherError(data.error || 'Calculation failed');
        setCalculation(null);
      }
    } catch (error) {
      console.error('Error calculating payment:', error);
      setVoucherError('Failed to calculate payment');
    } finally {
      setCalculating(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!reservationId || !selectedPaymentMethod) return;

    setPaymentStatus('processing');

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('hotel/payments/process_with_promotions/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: parseInt(reservationId),
          payment_method: selectedPaymentMethod,
          voucher_code: voucherCode || null,
          redeem_points: pointsToRedeem || 0,
          transaction_id: `TXN${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentStatus('completed');
        alert('Payment processed successfully!');

        // Redirect to bookings page after success
        setTimeout(() => {
          router.push('/bookings');
        }, 2000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      alert(error.message || 'Payment failed. Please try again.');
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const subtotal = calculation?.subtotal ? parseFloat(calculation.subtotal) : baseAmount;
  const voucherDiscount = calculation?.voucher.discount ? parseFloat(calculation.voucher.discount) : 0;
  const autoDiscount = calculation?.auto_discount.discount ? parseFloat(calculation.auto_discount.discount) : 0;
  const pointsValue = calculation?.loyalty_points.value ? parseFloat(calculation.loyalty_points.value) : 0;
  const totalDiscount = voucherDiscount + autoDiscount + pointsValue;
  const finalAmount = calculation?.final_amount ? parseFloat(calculation.final_amount) : subtotal;
  const pointsToEarn = calculation?.loyalty_points.to_earn || 0;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payment Processing</h1>
          <p className="text-gray-600 mt-1">Process reservation payment with promotions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Guest Info & Promotions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information */}
            {guestName && (
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <UserIcon className="h-5 w-5 text-[#4E61D3]" />
                  <h2 className="text-xl font-bold text-gray-900">Reservation Details</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Guest</p>
                    <p className="font-medium">{guestName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="font-medium">{roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-medium">{checkInDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-medium">{checkOutDate}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Apply Voucher */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Alert01Icon className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Apply Voucher Code</h2>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent uppercase"
                />
                <button
                  onClick={calculatePayment}
                  disabled={!voucherCode || calculating}
                  className="px-6 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors disabled:opacity-50"
                >
                  {calculating ? 'Validating...' : 'Apply'}
                </button>
                {voucherCode && (
                  <button
                    onClick={() => {
                      setVoucherCode('');
                      setVoucherError('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              {voucherError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {voucherError}
                </div>
              )}

              {calculation?.voucher.code && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">{calculation.voucher.name}</p>
                      <p className="text-xs text-green-700">Code: {calculation.voucher.code}</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      -{formatCurrency(calculation.voucher.discount)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Automatic Discounts */}
            {calculation?.auto_discount.name && (
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <SparklesIcon className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Automatic Discount Applied</h2>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">{calculation.auto_discount.name}</p>
                      <p className="text-xs text-purple-700">{calculation.auto_discount.type}</p>
                    </div>
                    <p className="text-lg font-bold text-purple-700">
                      -{formatCurrency(calculation.auto_discount.discount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loyalty Points */}
            {availablePoints && availablePoints.current_points > 0 && (
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <SparklesIcon className="h-5 w-5 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-900">Redeem Loyalty Points</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-700">Available Points</span>
                      <span className="text-2xl font-bold text-yellow-700">
                        {availablePoints.current_points.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tier</span>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                        {availablePoints.tier}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points to Redeem
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={availablePoints.current_points}
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Redeeming {pointsToRedeem.toLocaleString()} points = {formatCurrency(pointsValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Payment Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <File01Icon className="h-5 w-5 text-[#4E61D3]" />
                  <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Voucher Discount</span>
                    <span className="font-medium text-green-600">-{formatCurrency(voucherDiscount)}</span>
                  </div>
                )}

                {autoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Auto Discount</span>
                    <span className="font-medium text-purple-600">-{formatCurrency(autoDiscount)}</span>
                  </div>
                )}

                {pointsValue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Points Redeemed</span>
                    <span className="font-medium text-yellow-600">-{formatCurrency(pointsValue)}</span>
                  </div>
                )}

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Total Savings</span>
                    <span className="font-bold text-green-600">{formatCurrency(totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-300">
                  <span>Total to Pay</span>
                  <span className="text-[#4E61D3]">{formatCurrency(finalAmount)}</span>
                </div>

                {pointsToEarn > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-center">
                    <p className="text-xs text-blue-700">You will earn</p>
                    <p className="text-lg font-bold text-blue-800">+{pointsToEarn} points</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="h-5 w-5 text-[#4E61D3]" />
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`p-4 border flex items-center space-x-3 transition-all ${
                          selectedPaymentMethod === method.id
                            ? 'border-[#4E61D3] bg-[#4E61D3] bg-opacity-10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{method.name}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={
                    !selectedPaymentMethod ||
                    !reservationId ||
                    paymentStatus === 'processing' ||
                    paymentStatus === 'completed'
                  }
                  className="w-full py-4 bg-[#4E61D3] text-white font-bold hover:bg-[#3D4EA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentStatus === 'processing' ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing...
                    </>
                  ) : paymentStatus === 'completed' ? (
                    'Payment Completed ✓'
                  ) : (
                    `Pay ${formatCurrency(finalAmount)}`
                  )}
                </button>

                {paymentStatus === 'failed' && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                    Payment failed. Please try again.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const PaymentWithPromotionsPageWrapper = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentWithPromotionsPage />
    </Suspense>
  );
};

export default PaymentWithPromotionsPageWrapper;
