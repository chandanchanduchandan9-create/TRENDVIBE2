import { Order, OrderStatus } from '../src/types/index.ts';

export interface CourierTrackingDetails {
  orderId: string;
  orderNumber: string;
  courierPartner: 'Delhivery Express' | 'Blue Dart' | 'Shadowfax Quick' | 'Dunzo 30-Min Express' | 'DTDC Premium';
  awbTrackingNumber: string;
  trackingUrl: string;
  currentStatus: OrderStatus;
  statusLabel: string;
  currentLocation: string;
  destinationCity: string;
  pincode: string;
  estimatedDeliveryDate: string;
  estimatedDeliveryTimeWindow: string;
  dispatchedAt?: string;
  carrierPhone?: string;
  riderName?: string;
  milestones: {
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
    location: string;
  }[];
}

/**
 * Returns realistic courier shipment tracking details grounded in the order data.
 */
export function getCourierTrackingDetails(order: Order, hostHeader?: string): CourierTrackingDetails {
  const protocol = hostHeader?.includes('localhost') ? 'http' : 'https';
  const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : 'https://ais-dev-mq3niq6mrinqkexr7lwp57-652806784275.asia-southeast1.run.app';
  
  const orderDate = new Date(order.createdAt || Date.now());
  const pincode = order.shippingAddress?.pincode || '560103';
  const city = order.shippingAddress?.city || 'Bangalore';
  const isExpress = order.isExpress30Min || false;

  // Courier partner selection based on express delivery status
  const courierPartner = isExpress
    ? 'Dunzo 30-Min Express'
    : (parseInt(order.id.replace(/\D/g, '') || '1', 10) % 2 === 0 ? 'Delhivery Express' : 'Blue Dart');

  // Deterministic AWB Tracking Number generator
  const awbTrackingNumber = isExpress
    ? `DNZ-30M-${order.id.slice(-6).toUpperCase()}`
    : `DLH-88${order.id.replace(/\D/g, '').padEnd(8, '0').slice(0, 8)}`;

  const trackingUrl = `${baseUrl}?track=${encodeURIComponent(order.orderNumber || order.id)}`;

  // Estimated delivery dates calculation
  let estDateStr = '';
  let timeWindowStr = '';

  if (isExpress) {
    const estTime = new Date(orderDate.getTime() + 30 * 60 * 1000);
    estDateStr = 'Today (' + estTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ')';
    timeWindowStr = estTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (within 30 mins)';
  } else {
    const estTime = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    estDateStr = estTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    timeWindowStr = 'By 6:00 PM';
  }

  // Location based on order status
  let currentLocation = 'Bangalore Fulfillment Hub (Koramangala)';
  let statusLabel = 'Order Confirmed & Processing';

  if (order.orderStatus === 'PREPARING' || order.orderStatus === 'ACCEPTED') {
    currentLocation = 'Central Warehouse & Quality Check Station';
    statusLabel = 'Packed & Ready for Dispatch';
  } else if (order.orderStatus === 'READY_FOR_DISPATCH' || order.orderStatus === 'SHIPPED') {
    currentLocation = 'In Transit - Bangalore Sorting Facility (Whitefield Hub)';
    statusLabel = 'In Transit to Destination Hub';
  } else if (order.orderStatus === 'OUT_FOR_DELIVERY') {
    currentLocation = `Out for Delivery - Near ${pincode}, ${city}`;
    statusLabel = isExpress ? 'Rider En Route to Doorstep' : 'Out for Delivery with Delivery Executive';
  } else if (order.orderStatus === 'DELIVERED') {
    currentLocation = `Delivered at Customer Address (${city} - ${pincode})`;
    statusLabel = 'Successfully Delivered';
  } else if (order.orderStatus === 'CANCELLED') {
    currentLocation = 'Returned to Seller Inventory';
    statusLabel = 'Order Cancelled';
  }

  // Define Tracking Milestones
  const milestones = [
    {
      title: 'Order Placed & Confirmed',
      description: `Order #${order.orderNumber} created successfully. Payment: ${order.paymentStatus || 'PENDING'}.`,
      timestamp: order.createdAt,
      completed: true,
      location: 'TrendVibe Online Portal',
    },
    {
      title: 'Merchant Verification & Packaging',
      description: 'Items inspected, verified, and sealed with tamper-proof security tape.',
      timestamp: new Date(orderDate.getTime() + 15 * 60 * 1000).toISOString(),
      completed: ['PREPARING', 'READY_FOR_DISPATCH', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus),
      location: 'TrendVibe Central Hub & HealthMart',
    },
    {
      title: 'Handed to Courier Partner',
      description: `Dispatched via ${courierPartner} (AWB: ${awbTrackingNumber}).`,
      timestamp: new Date(orderDate.getTime() + 45 * 60 * 1000).toISOString(),
      completed: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus),
      location: 'Bangalore Sorting Facility',
    },
    {
      title: 'Out for Delivery',
      description: isExpress
        ? 'Rider Ramesh Kumar (+91 90193 63368) on Scooter KA 01 EV 4821 assigned for 30-min express arrival.'
        : `Package loaded in delivery vehicle for pin code ${pincode}.`,
      timestamp: new Date(orderDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus),
      location: `${city} Local Delivery Hub`,
    },
    {
      title: 'Delivered',
      description: 'Handed over to recipient with signature & OTP verification.',
      timestamp: order.orderStatus === 'DELIVERED' ? new Date().toISOString() : '',
      completed: order.orderStatus === 'DELIVERED',
      location: order.shippingAddress?.street || `${city} Doorstep`,
    },
  ];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    courierPartner,
    awbTrackingNumber,
    trackingUrl,
    currentStatus: order.orderStatus,
    statusLabel,
    currentLocation,
    destinationCity: city,
    pincode,
    estimatedDeliveryDate: estDateStr,
    estimatedDeliveryTimeWindow: timeWindowStr,
    dispatchedAt: new Date(orderDate.getTime() + 45 * 60 * 1000).toISOString(),
    carrierPhone: isExpress ? '+91 90193 63368' : '1800-209-6161',
    riderName: isExpress ? 'Ramesh Kumar (KA 01 EV 4821 • +91 90193 63368)' : 'Delhivery Executive',
    milestones,
  };
}
