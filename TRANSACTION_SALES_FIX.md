# Fixed: Transactions Not Appearing in Dashboard Sales

## Problem
After processing payments at `/transaction`, the sales were not appearing in "Total Penjualan Hari Ini" (Today's Total Sales) on the dashboard home page.

## Root Cause

The backend dashboard API only counts revenue from orders with `status='COMPLETED'`:

```python
# backend/apps/restaurant/viewsets.py (line 588-590)
total_revenue_today = orders_today.filter(
    status='COMPLETED'
).aggregate(total=Sum('payments__amount'))['total'] or 0
```

However, the transaction page payment flow was:
1. ✅ Create payment record
2. ✅ Show success message
3. ❌ **Did NOT update order status to COMPLETED**

Result: Orders remained in `PENDING` status after payment, so they weren't counted in the dashboard revenue.

## Solution

### 1. Update Order Status After Payment

**File:** `resto/src/app/(dashboard)/transaction/page.tsx`

**Added:**
```typescript
// Create payment via API
await api.createPayment({
  order: selectedOrder.id!,
  amount: total.toString(),
  payment_method: paymentMethod.toUpperCase() as 'CASH' | 'CARD' | 'MOBILE',
  status: 'COMPLETED'
})

// ✅ NEW: Update order status to COMPLETED after successful payment
await api.updateOrderStatus(selectedOrder.id!, 'COMPLETED')
```

Now the complete payment flow is:
1. ✅ Create payment record
2. ✅ **Update order status to COMPLETED**
3. ✅ Show success message
4. ✅ Print receipt

### 2. Add Dashboard Refresh Button

**File:** `resto/src/app/(dashboard)/page.tsx`

Added a manual refresh button so users can update sales data without reloading the page:

```typescript
<Button onClick={fetchData} variant="outline" disabled={loading}>
  {loading ? "Memuat..." : "Refresh"}
</Button>
```

## Testing

### Test the Complete Flow

1. **Start both servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   python manage.py runserver

   # Terminal 2: Frontend
   cd resto
   bun dev
   ```

2. **Create a test order:**
   - Go to http://localhost:3000/menu
   - Add items to cart
   - Select a table or choose takeaway
   - Create the order
   - Note the initial "Total Penjualan Hari Ini" value

3. **Process payment:**
   - Go to http://localhost:3000/transaction
   - Select the pending order
   - Enter customer name
   - Choose payment method (Cash/Card/QRIS)
   - If cash: Enter amount ≥ total
   - Click "BAYAR" button
   - Wait for success message and receipt

4. **Verify sales updated:**
   - Navigate back to home page (http://localhost:3000/)
   - OR click the **"Refresh"** button on dashboard
   - **Verify:** "Total Penjualan Hari Ini" has increased by the order amount
   - **Verify:** Transaction counter has increased by 1

### Expected Results

**Before Payment:**
- Order status: `PENDING` or `CONFIRMED`
- Dashboard shows: Previous sales total

**After Payment:**
- Order status: `COMPLETED` ✅
- Dashboard shows: Previous sales + new order total ✅
- Order appears in "Pesanan Terbaru" with green "Selesai" badge ✅
- Order removed from pending/unpaid list ✅

## Technical Details

### Order Status Flow

```
[Menu Page]
   ↓ Create Order
PENDING
   ↓ Confirm (optional)
CONFIRMED
   ↓ Kitchen Processes
PREPARING → READY
   ↓ Payment Processed
COMPLETED ← counts in revenue ✅
```

### Backend Dashboard Calculation

```python
# Only completed orders count toward revenue
total_revenue_today = orders_today.filter(
    status='COMPLETED'  # ← Must be COMPLETED
).aggregate(total=Sum('payments__amount'))['total'] or 0

# All today's orders count toward order count
total_orders_today = orders_today.count()
```

### Frontend Payment Flow

```typescript
handlePayment() {
  // 1. Create payment
  await api.createPayment(...)

  // 2. Update order status ← NEW
  await api.updateOrderStatus(orderId, 'COMPLETED')

  // 3. Show success + print receipt
  setShowPaymentSuccess(true)
  setShouldPrint(true)

  // 4. Refresh pending orders after 3s
  setTimeout(() => fetchPendingOrders(), 3000)
}
```

## Files Modified

1. **`resto/src/app/(dashboard)/transaction/page.tsx`**
   - Added `api.updateOrderStatus()` call after payment
   - Ensures order status changes to COMPLETED

2. **`resto/src/app/(dashboard)/page.tsx`**
   - Added Refresh button to manually reload dashboard data
   - Helpful for immediately seeing updated sales

## Additional Features

### Refresh Button Benefits

- **Manual refresh:** Click to update sales without page reload
- **Loading state:** Shows "Memuat..." while fetching
- **Spinning icon:** Visual feedback during refresh
- **Disabled state:** Prevents multiple simultaneous requests

### Payment Success Indicators

After successful payment, you should see:
1. ✅ Success modal with "Pembayaran Berhasil!"
2. ✅ Change amount displayed (if cash payment)
3. ✅ Receipt auto-prints in new window
4. ✅ Order removed from pending list
5. ✅ Dashboard sales updated (after refresh)

## Troubleshooting

### Sales still not updating?

1. **Check order status in Django admin:**
   - Go to http://localhost:8000/admin/
   - Check if order status is COMPLETED
   - If not, the status update failed

2. **Check browser console for errors:**
   - Open DevTools → Console
   - Look for API errors during payment
   - Check if `updateOrderStatus` API call succeeded

3. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/api/dashboard/summary/
   ```
   Should return today's sales data

4. **Test API directly:**
   ```bash
   # Get order details
   curl http://localhost:8000/api/orders/1/

   # Update order status
   curl -X POST http://localhost:8000/api/orders/1/update_status/ \
     -H "Content-Type: application/json" \
     -d '{"status": "COMPLETED"}'
   ```

### Dashboard shows 0 even with completed orders?

1. **Check date filter:** Dashboard shows TODAY's orders only
2. **Check branch filter:** Verify you're looking at the correct branch
3. **Check completed orders exist:**
   ```bash
   curl "http://localhost:8000/api/orders/?status=COMPLETED"
   ```

## Production Considerations

For production deployment:

1. **Add transaction locking:** Prevent duplicate payments
   ```typescript
   const [isProcessing, setIsProcessing] = useState(false)

   if (isProcessing) return
   setIsProcessing(true)
   try {
     await api.createPayment(...)
     await api.updateOrderStatus(...)
   } finally {
     setIsProcessing(false)
   }
   ```

2. **Add retry logic:** Handle network failures gracefully
3. **Add confirmation dialog:** "Are you sure?" before payment
4. **Log all transactions:** For audit trail
5. **Real-time updates:** Use WebSocket for live dashboard updates

## Summary

✅ **Fixed:** Transactions now update order status to COMPLETED
✅ **Fixed:** Completed transactions appear in dashboard sales
✅ **Added:** Manual refresh button for immediate updates
✅ **Improved:** Better user feedback with loading states

The transaction flow now properly:
1. Creates payment record
2. Updates order status
3. Counts in dashboard revenue
4. Shows in completed orders list
