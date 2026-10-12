import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Check,
    Copy,
    Phone,
    Mail,
    MapPin,
    Package,
    Truck,
    CreditCard,
    Calendar,
    Printer,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Clock,
    Trash2,
    Sparkles,
    ShieldCheck,
    MessageCircle,
    Send
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import DriveImage from './DriveImage';
import { parseOrderItem, getOrderStatusMeta, formatSafeDate } from '../utils/orderItemHelpers';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any | null;
    onOrderUpdated?: (updatedOrder: any) => void;
    onOrderDeleted?: (orderId: string) => void;
}

export default function OrderDetailsModal({
    isOpen,
    onClose,
    order,
    onOrderUpdated,
    onOrderDeleted
}: OrderDetailsModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<string>(order?.status || 'paid');
    
    // Courier Tracking States
    const [courierPartner, setCourierPartner] = useState<string>('');
    const [trackingNumber, setTrackingNumber] = useState<string>('');
    const [isSavingTracking, setIsSavingTracking] = useState(false);
    const [trackingSavedSuccess, setTrackingSavedSuccess] = useState(false);

    useEffect(() => {
        if (order) {
            setCurrentStatus(order.status || (order.paymentMethod === 'cod' ? 'cod_pending' : 'paid'));
            setCourierPartner(order.courierPartner || '');
            setTrackingNumber(order.trackingNumber || '');
            setTrackingSavedSuccess(false);
        }
    }, [order]);

    // Handle ESC key close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !order) return null;

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!order?.id || isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        try {
            await updateDoc(doc(db, "orders", order.id), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            setCurrentStatus(newStatus);
            if (onOrderUpdated) {
                onOrderUpdated({ ...order, status: newStatus });
            }
        } catch (err: any) {
            alert(`Failed to update status: ${err.message}`);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSaveTracking = async () => {
        if (!order?.id || isSavingTracking) return;
        setIsSavingTracking(true);
        try {
            await updateDoc(doc(db, "orders", order.id), {
                courierPartner,
                trackingNumber,
                trackingUpdatedAt: new Date().toISOString()
            });
            setTrackingSavedSuccess(true);
            setTimeout(() => setTrackingSavedSuccess(false), 3000);
            if (onOrderUpdated) {
                onOrderUpdated({ ...order, courierPartner, trackingNumber });
            }
        } catch (err: any) {
            alert(`Failed to save tracking: ${err.message}`);
        } finally {
            setIsSavingTracking(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!order?.id) return;
        const confirmDelete = window.confirm(
            `Are you sure you want to PERMANENTLY delete Order #${order.id}?\n\nCustomer: ${order.userName || 'Guest'}\nAmount: ₹${(order.totalAmount || 0).toLocaleString()}\n\nThis action cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "orders", order.id));
            if (onOrderDeleted) {
                onOrderDeleted(order.id);
            }
            onClose();
            alert("Order deleted successfully.");
        } catch (err: any) {
            alert(`Error deleting order: ${err.message}`);
        }
    };

    const items = Array.isArray(order.items) ? order.items : [];
    const statusMeta = getOrderStatusMeta(currentStatus);

    // Format Full Shipping Address text for copying
    const shipping = order.shippingAddress || {};
    const formattedShippingAddress = [
        shipping.fullName || order.userName,
        shipping.phone || order.userPhone,
        shipping.addressLine1,
        shipping.addressLine2,
        shipping.city ? `${shipping.city}, ${shipping.state || ''} - ${shipping.pinCode || ''}` : '',
        'India'
    ].filter(Boolean).join('\n');

    // Clean phone number for WhatsApp / Tel
    const cleanPhone = (order.userPhone || shipping.phone || '').replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Generate WhatsApp Message Template
    const itemsSummary = items.map((it: any) => {
        const p = parseOrderItem(it, order);
        return `• ${p.cleanTitle} [${p.badgeLabel}] (Qty: ${it.quantity || 1})`;
    }).join('\n');

    const whatsappText = encodeURIComponent(
        `Hello ${order.userName || 'Customer'},\n\nThank you for choosing *Aaditya's Aura Luxury Fragrances*!\n\n` +
        `📦 *Order Details:*\n` +
        `• Order ID: #${order.id}\n` +
        `${itemsSummary}\n` +
        `• Total Amount: ₹${(order.totalAmount || 0).toLocaleString()} (${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'})\n` +
        `• Status: *${statusMeta.label}*\n\n` +
        (trackingNumber ? `🚚 *Courier Tracking:*\n• Courier: ${courierPartner || 'Standard Express'}\n• Tracking/AWB: ${trackingNumber}\n\n` : '') +
        `We are handling your fragrance with supreme care. If you have any questions, feel free to reply directly here.\n\nWarm regards,\n*Aaditya's Aura Team*`
    );

    // Print Packing Slip Handler
    const handlePrintPackingSlip = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) {
            alert("Please allow popups to print packing slip.");
            return;
        }

        const itemsRows = items.map((it: any, idx: number) => {
            const p = parseOrderItem(it, order);
            return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold;">${idx + 1}</td>
                    <td style="padding: 12px;">
                        <div style="font-weight: bold; font-size: 14px;">${p.cleanTitle}</div>
                        <div style="display: inline-block; background-color: #f3f4f6; color: #1f2937; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-top: 4px;">
                            ${p.badgeLabel}
                        </div>
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                            <strong>Instruction:</strong> ${p.packagingGuide}
                        </div>
                    </td>
                    <td style="padding: 12px; text-align: center; font-weight: bold; font-size: 14px;">${it.quantity || 1}</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold;">₹${(it.price || 0).toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #000; border-radius: 3px;"></span>
                    </td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Packing Slip - Order #${order.id}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
                    .header { border-bottom: 2px solid #b89758; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .brand { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #1a1a1a; }
                    .brand-sub { font-size: 11px; color: #b89758; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
                    .order-meta { text-align: right; }
                    .grid { display: flex; justify-content: space-between; margin-bottom: 24px; gap: 24px; }
                    .card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; flex: 1; }
                    .card h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e5e7eb; }
                    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #6b7280; display: flex; justify-content: space-between; align-items: center; }
                    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="brand">AADITYA’S AURA</div>
                        <div class="brand-sub">Pure Luxury Attar & Fine Perfumery</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">Official Dispatch & Fulfillment Slip</div>
                    </div>
                    <div class="order-meta">
                        <div style="font-size: 16px; font-weight: 800; font-family: monospace;">Order #${order.id}</div>
                        <div style="font-size: 12px; color: #555; margin-top: 4px;">Date: ${formatSafeDate(order.createdAt)}</div>
                        <div style="margin-top: 6px;">
                            <span class="badge" style="background: #fef3c7; color: #92400e;">
                                Payment: ${order.paymentMethod === 'cod' ? 'CASH ON DELIVERY (COD)' : 'PAID ONLINE'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="grid">
                    <div class="card">
                        <h4>Recipient & Delivery Address</h4>
                        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${shipping.fullName || order.userName || 'Customer'}</div>
                        <div style="font-size: 12px; color: #374151; line-height: 1.5;">
                            ${shipping.addressLine1 || ''}<br/>
                            ${shipping.addressLine2 ? shipping.addressLine2 + '<br/>' : ''}
                            ${shipping.city || ''}, ${shipping.state || ''} - <strong>${shipping.pinCode || ''}</strong><br/>
                            <strong>Phone:</strong> ${shipping.phone || order.userPhone || 'N/A'}<br/>
                            <strong>Email:</strong> ${order.userEmail || 'N/A'}
                        </div>
                    </div>
                    <div class="card">
                        <h4>Order & Dispatch Notes</h4>
                        <div style="font-size: 12px; color: #374151; line-height: 1.6;">
                            <strong>Status:</strong> ${statusMeta.label}<br/>
                            <strong>Payment ID:</strong> <span style="font-family: monospace;">${order.paymentId || 'N/A'}</span><br/>
                            <strong>Courier:</strong> ${courierPartner || 'Pending'}<br/>
                            <strong>AWB / Tracking:</strong> ${trackingNumber || 'Pending'}<br/>
                            <strong>Fragrance Bottles Total:</strong> ${items.length} item(s)
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">#</th>
                            <th>Fragrance Masterpiece Details</th>
                            <th style="text-align: center; width: 60px;">Qty</th>
                            <th style="text-align: right; width: 100px;">Price</th>
                            <th style="text-align: center; width: 60px;">Check</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
                    <div style="width: 280px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                            <span>Subtotal:</span>
                            <span>₹${(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                            <span>Shipping Delivery:</span>
                            <span style="color: #16a34a; font-weight: bold;">FREE</span>
                        </div>
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 800;">
                            <span>Grand Total:</span>
                            <span style="color: #b89758;">₹${(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div>Packed By: ___________________ &nbsp;&nbsp;&nbsp;&nbsp; Quality Verified By: ___________________</div>
                    <div>Thank you for choosing Aaditya's Aura!</div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
                    {/* Dark Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="w-full max-w-4xl bg-white rounded-[32px] border border-gold/20 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh]"
                    >
                        {/* Header Bar */}
                        <div className="p-6 border-b border-gold/15 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold shrink-0">
                                    <Package size={22} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-lg font-serif font-bold text-charcoal">
                                            Order Details
                                        </h2>
                                        <span className="font-mono text-xs font-bold text-charcoal/60 bg-gold/5 border border-gold/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                            #{order.id}
                                            <button
                                                onClick={() => copyToClipboard(order.id, 'orderId')}
                                                className="text-gold hover:text-gold/80 cursor-pointer"
                                                title="Copy Order ID"
                                            >
                                                {copiedField === 'orderId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            </button>
                                        </span>
                                    </div>
                                    <p className="text-xs text-charcoal/50 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        <Calendar size={12} className="text-gold" />
                                        {formatSafeDate(order.createdAt)}
                                        <span className="text-charcoal/20">•</span>
                                        <span className="text-[11px] font-medium text-charcoal/60">
                                            {items.length} item{items.length > 1 ? 's' : ''} ordered
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    onClick={handlePrintPackingSlip}
                                    className="px-3.5 py-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Print Packing Slip & Invoice"
                                >
                                    <Printer size={15} />
                                    <span className="hidden sm:inline">Print Slip</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-xl text-charcoal/40 hover:text-charcoal hover:bg-zinc-100 transition-colors cursor-pointer"
                                    title="Close Modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Status and Workflow Control Bar */}
                            <div className="p-4 bg-zinc-50 border border-gold/15 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${statusMeta.dotColor} animate-pulse`} />
                                    <div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal/40 block">
                                            Current Order Status
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badgeBg}`}>
                                                {statusMeta.label}
                                            </span>
                                            <span className="text-xs text-charcoal/50 italic hidden sm:inline">
                                                — {statusMeta.description}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                                    <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">
                                        Update Status:
                                    </label>
                                    <select
                                        value={currentStatus}
                                        disabled={isUpdatingStatus}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="bg-white border border-gold/25 rounded-xl px-3 py-1.5 text-xs font-bold text-charcoal focus:outline-none focus:border-gold cursor-pointer shadow-xs disabled:opacity-50"
                                    >
                                        <option value="cod_pending">COD Pending</option>
                                        <option value="upi_pending">UPI Pending</option>
                                        <option value="paid">Paid Online</option>
                                        <option value="approved">Approved for Packing</option>
                                        <option value="shipped">Shipped (In Transit)</option>
                                        <option value="completed">Completed (Delivered)</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>

                                    {currentStatus === 'cod_pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange('approved')}
                                                disabled={isUpdatingStatus}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange('rejected')}
                                                disabled={isUpdatingStatus}
                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {currentStatus === 'approved' && (
                                        <button
                                            onClick={() => handleStatusChange('shipped')}
                                            disabled={isUpdatingStatus}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                        >
                                            <Truck size={14} /> Mark Shipped
                                        </button>
                                    )}

                                    {currentStatus === 'shipped' && (
                                        <button
                                            onClick={() => handleStatusChange('completed')}
                                            disabled={isUpdatingStatus}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 size={14} /> Mark Delivered
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Section: ORDERED PERFUMES & ITEMS (Highlight with ML & Type) */}
                            <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-xs">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/10">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="text-gold" size={18} />
                                        <h3 className="font-serif font-bold text-base text-charcoal">
                                            Ordered Items & Fragrance Specifications
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold bg-gold/5 px-2.5 py-1 rounded-full border border-gold/20">
                                        {items.length} Product{items.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item: any, idx: number) => {
                                        const parsed = parseOrderItem(item, order);
                                        return (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-2xl bg-gradient-to-r from-luxury-cream/40 via-white to-luxury-cream/20 border border-gold/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-gold/30"
                                            >
                                                {/* Image and Basic Info */}
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    {item.imageUrl ? (
                                                        <div className="w-16 h-16 rounded-xl border border-gold/20 overflow-hidden bg-white shadow-xs shrink-0">
                                                            <DriveImage
                                                                src={item.imageUrl}
                                                                className="w-full h-full object-cover"
                                                                alt={parsed.cleanTitle}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-xl border border-gold/20 bg-gold/5 flex items-center justify-center text-gold shrink-0">
                                                            <Package size={24} />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <h4 className="font-serif font-bold text-base text-charcoal leading-snug">
                                                            {parsed.cleanTitle}
                                                        </h4>

                                                        {/* PROMINENT PERFUME / ATTAR & ML BADGES */}
                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            {parsed.categoryType === 'Attar' && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-emerald-100 to-amber-100 text-emerald-950 border border-emerald-300 shadow-xs flex items-center gap-1.5">
                                                                    <span>🌿</span>
                                                                    <span>ATTAR (Pure Oil)</span>
                                                                    <span className="font-black text-amber-900">• {parsed.size || '6ml'}</span>
                                                                    <span className="text-[10px] text-emerald-800">({parsed.sizeLabel})</span>
                                                                </span>
                                                            )}

                                                            {parsed.categoryType === 'Perfume' && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-950 border border-indigo-300 shadow-xs flex items-center gap-1.5">
                                                                    <span>✨</span>
                                                                    <span>PERFUME (Spray EDP)</span>
                                                                    <span className="font-black text-purple-900">• {parsed.size || '50-60ml'}</span>
                                                                    <span className="text-[10px] text-indigo-800">({parsed.sizeLabel})</span>
                                                                </span>
                                                            )}

                                                            {parsed.categoryType === 'Jewellery' && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 shadow-xs flex items-center gap-1.5">
                                                                    <span>💎</span>
                                                                    <span>FINE JEWELLERY</span>
                                                                </span>
                                                            )}

                                                            {parsed.categoryType === 'Other' && (
                                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-zinc-100 text-zinc-800 border border-zinc-200">
                                                                    {parsed.size ? `${parsed.size}` : 'Standard'}
                                                                </span>
                                                            )}

                                                            <span className="text-xs text-charcoal/50 font-medium">
                                                                Quantity: <strong className="text-charcoal">{item.quantity || 1}</strong>
                                                            </span>
                                                        </div>

                                                        {/* Packaging Instruction Helper */}
                                                        <div className="mt-2.5 text-[11px] text-charcoal/70 bg-white/80 border border-gold/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                                            <span className="text-gold font-bold">📦 Packing Guide:</span>
                                                            <span className="font-medium text-charcoal">{parsed.packagingGuide}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Price details */}
                                                <div className="text-right shrink-0 self-end md:self-center pl-4 border-t md:border-t-0 md:border-l border-gold/10 pt-2 md:pt-0">
                                                    <span className="text-[10px] text-charcoal/40 uppercase font-bold block">Price</span>
                                                    <span className="text-lg font-serif font-bold text-gold">
                                                        ₹{(item.price || 0).toLocaleString()}
                                                    </span>
                                                    {(item.quantity > 1) && (
                                                        <span className="text-[11px] text-charcoal/50 block">
                                                            Subtotal: ₹{((item.price || 0) * item.quantity).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section: CUSTOMER DETAILS & SHIPPING ADDRESS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/10">
                                            <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                                                <Phone className="text-gold" size={16} />
                                                Customer Information
                                            </h3>
                                        </div>

                                        <div className="space-y-3.5 text-xs">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 block">Full Name</span>
                                                <p className="font-bold text-sm text-charcoal mt-0.5">
                                                    {order.userName || shipping.fullName || 'Guest Customer'}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 block">Phone Number</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="font-mono font-bold text-charcoal text-sm">
                                                        {order.userPhone || shipping.phone || 'No Phone'}
                                                    </p>
                                                    {cleanPhone && (
                                                        <button
                                                            onClick={() => copyToClipboard(order.userPhone || shipping.phone, 'phone')}
                                                            className="text-gold hover:text-gold/80"
                                                            title="Copy Phone"
                                                        >
                                                            {copiedField === 'phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 block">Email Address</span>
                                                <p className="text-charcoal/70 mt-0.5 break-all">
                                                    {order.userEmail || 'N/A'}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 block">User Account</span>
                                                <p className="font-mono text-[11px] text-charcoal/50 mt-0.5">
                                                    User ID: {order.userId || 'Guest'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons for Customer: WhatsApp & Call */}
                                    <div className="pt-4 mt-4 border-t border-gold/10 flex gap-2">
                                        {cleanPhone ? (
                                            <>
                                                <a
                                                    href={`https://wa.me/${intlPhone}?text=${whatsappText}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                                                >
                                                    <MessageCircle size={15} /> WhatsApp
                                                </a>
                                                <a
                                                    href={`tel:${cleanPhone}`}
                                                    className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-charcoal rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                                    title="Call Customer"
                                                >
                                                    <Phone size={14} /> Call
                                                </a>
                                            </>
                                        ) : (
                                            <span className="text-[11px] text-charcoal/40 italic">No phone number available</span>
                                        )}
                                    </div>
                                </div>

                                {/* Shipping Address Card */}
                                <div className="bg-white border border-gold/15 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/10">
                                            <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                                                <MapPin className="text-gold" size={16} />
                                                Shipping Address
                                            </h3>
                                            {formattedShippingAddress && (
                                                <button
                                                    onClick={() => copyToClipboard(formattedShippingAddress, 'address')}
                                                    className="text-xs font-bold text-gold hover:text-gold/80 flex items-center gap-1 cursor-pointer"
                                                    title="Copy Complete Address for Shipping Label"
                                                >
                                                    {copiedField === 'address' ? (
                                                        <span className="text-emerald-600 flex items-center gap-1"><Check size={12} /> Copied</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><Copy size={12} /> Copy Address</span>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {shipping.addressLine1 || shipping.city ? (
                                            <div className="space-y-2 text-xs leading-relaxed text-charcoal/80">
                                                <p className="font-bold text-sm text-charcoal">{shipping.fullName || order.userName}</p>
                                                <p>{shipping.addressLine1}</p>
                                                {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                                                <p>
                                                    <span className="font-semibold">{shipping.city}</span>, {shipping.state}{' '}
                                                    - <strong className="text-charcoal font-black">{shipping.pinCode}</strong>
                                                </p>
                                                <p className="text-charcoal/50 mt-1">Country: India</p>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-charcoal/30 italic">
                                                No structured address provided on this order.
                                            </div>
                                        )}
                                    </div>

                                    {/* Dispatch / Courier Tracking Box */}
                                    <div className="pt-4 mt-4 border-t border-gold/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50 flex items-center gap-1">
                                                <Truck size={12} className="text-gold" /> Courier Tracking / AWB
                                            </span>
                                            {trackingSavedSuccess && (
                                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                    <Check size={11} /> Saved
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Courier (e.g. BlueDart)"
                                                value={courierPartner}
                                                onChange={(e) => setCourierPartner(e.target.value)}
                                                className="bg-zinc-50 border border-gold/15 rounded-xl px-2.5 py-1.5 text-xs text-charcoal focus:outline-none focus:border-gold"
                                            />
                                            <input
                                                type="text"
                                                placeholder="AWB / Tracking #"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                className="bg-zinc-50 border border-gold/15 rounded-xl px-2.5 py-1.5 text-xs text-charcoal focus:outline-none focus:border-gold font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveTracking}
                                            disabled={isSavingTracking}
                                            className="mt-2 w-full py-1.5 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {isSavingTracking ? 'Saving...' : 'Save Tracking Info'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Section: PAYMENT & FINANCIAL SUMMARY */}
                            <div className="bg-gradient-to-br from-luxury-white via-white to-gold/5 border border-gold/20 rounded-3xl p-6 shadow-xs">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/10">
                                    <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                                        <CreditCard className="text-gold" size={16} />
                                        Payment & Financial Overview
                                    </h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                        order.paymentMethod === 'cod'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay / UPI)'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div className="p-3 bg-white border border-gold/10 rounded-2xl">
                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block">Payment Method</span>
                                        <span className="font-bold text-charcoal text-sm mt-0.5 block">
                                            {order.paymentMethod === 'cod' ? 'COD' : 'Online Gateway'}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-white border border-gold/10 rounded-2xl">
                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block">Transaction / Pay ID</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="font-mono font-bold text-charcoal text-xs truncate max-w-[140px]" title={order.paymentId}>
                                                {order.paymentId || 'N/A'}
                                            </span>
                                            {order.paymentId && (
                                                <button
                                                    onClick={() => copyToClipboard(order.paymentId, 'paymentId')}
                                                    className="text-gold hover:text-gold/80"
                                                    title="Copy Payment ID"
                                                >
                                                    {copiedField === 'paymentId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-white border border-gold/10 rounded-2xl">
                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block">Delivery Charges</span>
                                        <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
                                            FREE Shipping
                                        </span>
                                    </div>

                                    <div className="p-3 bg-white border border-gold/25 rounded-2xl bg-gold/5">
                                        <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Grand Total</span>
                                        <span className="font-serif font-black text-charcoal text-xl mt-0.5 block">
                                            ₹{(order.totalAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-gold/15 bg-zinc-50 flex items-center justify-between gap-4 shrink-0">
                            <button
                                onClick={handleDeleteOrder}
                                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer border border-rose-200"
                            >
                                <Trash2 size={15} /> Delete Order
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-white border border-gold/20 hover:border-gold text-charcoal font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
