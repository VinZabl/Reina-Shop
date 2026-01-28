import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, X, Copy, Check, Download, Eye, CreditCard } from 'lucide-react';
import { CartItem, CustomField, OrderStatus } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useImageUpload } from '../hooks/useImageUpload';
import { useOrders } from '../hooks/useOrders';
import { useSiteSettings } from '../hooks/useSiteSettings';
import OrderStatusModal from './OrderStatusModal';

const CHECKOUT_STORAGE_KEYS = {
  paymentMethodUuid: 'reina_checkout_paymentMethodUuid',
  customFieldValues: 'reina_checkout_customFieldValues',
  receiptImageUrl: 'reina_checkout_receiptImageUrl',
  receiptPreview: 'reina_checkout_receiptPreview',
  bulkInputValues: 'reina_checkout_bulkInputValues',
  bulkSelectedGames: 'reina_checkout_bulkSelectedGames',
};

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  onNavigateToMenu?: () => void; // Callback to navigate to menu (e.g., after order succeeded)
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack, onNavigateToMenu }) => {
  const { paymentMethods } = usePaymentMethods();
  const { uploadImage, uploading: uploadingReceipt } = useImageUpload();
  const { createOrder, fetchOrderById } = useOrders();
  const { siteSettings } = useSiteSettings();
  const orderOption = siteSettings?.order_option || 'order_via_messenger';
  const [paymentMethodUuid, setPaymentMethodUuid] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CHECKOUT_STORAGE_KEYS.paymentMethodUuid);
    } catch { return null; }
  });
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [, setShowScrollIndicator] = useState(true);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEYS.customFieldValues);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(() =>
    localStorage.getItem(CHECKOUT_STORAGE_KEYS.receiptImageUrl)
  );
  const [receiptPreview, setReceiptPreview] = useState<string | null>(() =>
    localStorage.getItem(CHECKOUT_STORAGE_KEYS.receiptPreview)
  );
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasCopiedMessage, setHasCopiedMessage] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [copiedAccountName, setCopiedAccountName] = useState(false);
  const [bulkInputValues, setBulkInputValues] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEYS.bulkInputValues);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [bulkSelectedGames, setBulkSelectedGames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEYS.bulkSelectedGames);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [existingOrderStatus, setExistingOrderStatus] = useState<OrderStatus | null>(null);
  const [, setIsCheckingExistingOrder] = useState(true);

  // Restore payment method from localStorage (by uuid)
  useEffect(() => {
    const saved = localStorage.getItem(CHECKOUT_STORAGE_KEYS.paymentMethodUuid);
    if (saved && paymentMethods.length > 0) {
      const method = paymentMethods.find(m => m.uuid_id === saved);
      if (method) setPaymentMethodUuid(method.uuid_id);
    }
  }, [paymentMethods]);

  // Persist checkout state to localStorage
  useEffect(() => {
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.customFieldValues, JSON.stringify(customFieldValues));
  }, [customFieldValues]);
  useEffect(() => {
    if (receiptImageUrl) localStorage.setItem(CHECKOUT_STORAGE_KEYS.receiptImageUrl, receiptImageUrl);
    else localStorage.removeItem(CHECKOUT_STORAGE_KEYS.receiptImageUrl);
  }, [receiptImageUrl]);
  useEffect(() => {
    if (receiptPreview) localStorage.setItem(CHECKOUT_STORAGE_KEYS.receiptPreview, receiptPreview);
    else localStorage.removeItem(CHECKOUT_STORAGE_KEYS.receiptPreview);
  }, [receiptPreview]);
  useEffect(() => {
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.bulkInputValues, JSON.stringify(bulkInputValues));
  }, [bulkInputValues]);
  useEffect(() => {
    localStorage.setItem(CHECKOUT_STORAGE_KEYS.bulkSelectedGames, JSON.stringify(bulkSelectedGames));
  }, [bulkSelectedGames]);
  useEffect(() => {
    if (paymentMethodUuid) localStorage.setItem(CHECKOUT_STORAGE_KEYS.paymentMethodUuid, paymentMethodUuid);
    else localStorage.removeItem(CHECKOUT_STORAGE_KEYS.paymentMethodUuid);
  }, [paymentMethodUuid]);

  // Show payment details modal when payment method is selected (tarchier-style)
  useEffect(() => {
    if (paymentMethodUuid) setShowPaymentDetailsModal(true);
  }, [paymentMethodUuid]);

  // Extract original menu item ID from cart item ID (format: "menuItemId:::CART:::timestamp-random")
  // This allows us to group all packages from the same game together
  const getOriginalMenuItemId = (cartItemId: string): string => {
    const parts = cartItemId.split(':::CART:::');
    return parts.length > 1 ? parts[0] : cartItemId;
  };

  // Group custom fields by item/game
  // If any game has custom fields, show those grouped by game. Otherwise, show default "IGN" field
  // Deduplicate by original menu item ID to avoid showing the same fields multiple times for the same game
  // (even if different packages/variations are selected)
  const itemsWithCustomFields = useMemo(() => {
    const itemsWithFields = cartItems.filter(item => item.customFields && item.customFields.length > 0);
    // Deduplicate by original menu item ID
    const uniqueItems = new Map<string, typeof cartItems[0]>();
    itemsWithFields.forEach(item => {
      const originalId = getOriginalMenuItemId(item.id);
      if (!uniqueItems.has(originalId)) {
        uniqueItems.set(originalId, item);
      }
    });
    return Array.from(uniqueItems.values());
  }, [cartItems]);

  const hasAnyCustomFields = itemsWithCustomFields.length > 0;

  // Get bulk input fields based on selected games - position-based
  // If selected games have N fields, show N bulk input fields
  const bulkInputFields = useMemo(() => {
    if (bulkSelectedGames.length === 0) return [];
    
    // Get all selected items (bulkSelectedGames contains original menu item IDs)
    const selectedItems = itemsWithCustomFields.filter(item => 
      bulkSelectedGames.includes(getOriginalMenuItemId(item.id))
    );
    
    if (selectedItems.length === 0) return [];
    
    // Find the maximum number of fields across all selected games
    const maxFields = Math.max(...selectedItems.map(item => item.customFields?.length || 0));
    
    if (maxFields === 0) return [];
    
    // Create fields array based on position (index)
    // Use the first selected item's fields as reference for labels
    const referenceItem = selectedItems[0];
    const fields: Array<{ index: number, field: CustomField | null }> = [];
    
    for (let i = 0; i < maxFields; i++) {
      // Try to get field from reference item, or use a placeholder
      const field = referenceItem.customFields?.[i] || null;
      fields.push({ index: i, field });
    }
    
    return fields;
  }, [bulkSelectedGames, itemsWithCustomFields]);

  // Sync bulk input values to selected games by position
  React.useEffect(() => {
    if (bulkSelectedGames.length === 0) return;
    
    const updates: Record<string, string> = {};
    
    // Get selected items (bulkSelectedGames contains original menu item IDs)
    const selectedItems = itemsWithCustomFields.filter(item => 
      bulkSelectedGames.includes(getOriginalMenuItemId(item.id))
    );
    
    // For each bulk input field (by index)
    Object.entries(bulkInputValues).forEach(([fieldIndexStr, value]) => {
      const fieldIndex = parseInt(fieldIndexStr, 10);
      
      // Apply to all selected games at the same field position
      selectedItems.forEach((item) => {
        if (item.customFields && item.customFields[fieldIndex]) {
          const field = item.customFields[fieldIndex];
          const originalId = getOriginalMenuItemId(item.id);
          // Find the actual itemIndex from itemsWithCustomFields
          const actualItemIndex = itemsWithCustomFields.findIndex(i => getOriginalMenuItemId(i.id) === originalId);
          if (actualItemIndex !== -1) {
            // Use fieldIndex to ensure uniqueness even if field.key is duplicated
            const valueKey = `${originalId}_${fieldIndex}_${field.key}`;
            updates[valueKey] = value;
          }
        }
      });
    });
    
    if (Object.keys(updates).length > 0) {
      setCustomFieldValues(prev => ({ ...prev, ...updates }));
    }
  }, [bulkInputValues, bulkSelectedGames, itemsWithCustomFields]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check if buttons section is visible to hide scroll indicator
  React.useEffect(() => {
    if (!buttonsRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setShowScrollIndicator(false);
          else setShowScrollIndicator(true);
        });
      },
      { threshold: 0.1, rootMargin: '-50px 0px' }
    );
    observer.observe(buttonsRef.current);
    return () => observer.disconnect();
  }, []);

  const selectedPaymentMethod = paymentMethods.find(method => method.uuid_id === paymentMethodUuid);
  
  const handleBulkInputChange = (fieldKey: string, value: string) => {
    setBulkInputValues(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleBulkGameSelectionChange = (itemId: string, checked: boolean) => {
    // itemId is the cart item ID, convert to original menu item ID
    const originalId = getOriginalMenuItemId(itemId);
    if (checked) {
      setBulkSelectedGames(prev => [...prev, originalId]);
    } else {
      setBulkSelectedGames(prev => prev.filter(id => id !== originalId));
    }
  };

  const handleReceiptUpload = async (file: File) => {
    try {
      setReceiptError(null);
      setReceiptFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
      const url = await uploadImage(file, 'payment-receipts');
      setReceiptImageUrl(url);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      setReceiptError(error instanceof Error ? error.message : 'Failed to upload receipt');
      setReceiptFile(null);
      setReceiptPreview(null);
    }
  };

  const handleReceiptRemove = () => {
    setReceiptFile(null);
    setReceiptImageUrl(null);
    setReceiptPreview(null);
    setReceiptError(null);
    setHasCopiedMessage(false); // Reset copy state when receipt is removed
  };

  // Generate the order message text
  const generateOrderMessage = (): string => {
    // Build custom fields section grouped by game
    let customFieldsSection = '';
    if (hasAnyCustomFields) {
      // Group games by their field values (to simplify when bulk input is used)
      const gamesByFieldValues = new Map<string, { games: string[], fields: Array<{ label: string, value: string }> }>();
      
      itemsWithCustomFields.forEach(item => {
        // Get all field values for this game (use original menu item ID)
        const originalId = getOriginalMenuItemId(item.id);
        const fields = item.customFields?.map(field => {
          const valueKey = `${originalId}_${field.key}`;
          const value = customFieldValues[valueKey] || '';
          return value ? { label: field.label, value } : null;
        }).filter(Boolean) as Array<{ label: string, value: string }> || [];
        
        if (fields.length === 0) return;
        
        // Create a key based on field values (to group games with same values)
        const valueKey = fields.map(f => `${f.label}:${f.value}`).join('|');
        
        if (!gamesByFieldValues.has(valueKey)) {
          gamesByFieldValues.set(valueKey, { games: [], fields });
        }
        gamesByFieldValues.get(valueKey)!.games.push(item.name);
      });
      
      // Build the section
      const sections: string[] = [];
      gamesByFieldValues.forEach(({ games, fields }) => {
        if (games.length === 0 || fields.length === 0) return;
        
        // Add game names
        sections.push(games.join('\n'));
        
        // If all values are the same, combine into one line
        const allValuesSame = fields.every(f => f.value === fields[0].value);
        if (allValuesSame && fields.length > 1) {
          const labels = fields.map(f => f.label).join(', ');
          const lastCommaIndex = labels.lastIndexOf(',');
          const combinedLabels = lastCommaIndex > 0 
            ? labels.substring(0, lastCommaIndex) + ' &' + labels.substring(lastCommaIndex + 1)
            : labels;
          sections.push(`${combinedLabels}: ${fields[0].value}`);
        } else {
          // Different values, show each field separately
          const fieldStrings = fields.map(f => `${f.label}: ${f.value}`).join(', ');
          sections.push(fieldStrings);
        }
      });
      
      if (sections.length > 0) {
        customFieldsSection = sections.join('\n');
      }
    } else {
      customFieldsSection = `🎮 IGN: ${customFieldValues['default_ign'] || ''}`;
    }

    const orderDetails = `
🛒 Reina Shop ORDER

${customFieldsSection}

📋 ORDER DETAILS:
${cartItems.map(item => {
  let itemDetails = `• ${item.name}`;
  if (item.selectedVariation) {
    itemDetails += ` (${item.selectedVariation.name})`;
  }
  itemDetails += ` x${item.quantity} - ₱${item.totalPrice * item.quantity}`;
  return itemDetails;
}).join('\n')}

💰 TOTAL: ₱${totalPrice}

💳 Payment: ${selectedPaymentMethod?.name || ''}

📸 Payment Receipt: ${receiptImageUrl || ''}

Please confirm this order to proceed. Thank you for choosing Reina Shop! 🎮
    `.trim();

    return orderDetails;
  };

  const handleCopyMessage = async () => {
    try {
      const message = generateOrderMessage();
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setHasCopiedMessage(true); // Mark that copy button has been clicked
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountNumber(true);
      setTimeout(() => setCopiedAccountNumber(false), 2000);
    } catch (error) {
      console.error('Failed to copy account number:', error);
    }
  };

  const handleCopyAccountName = async (accountName: string) => {
    try {
      await navigator.clipboard.writeText(accountName);
      setCopiedAccountName(true);
      setTimeout(() => setCopiedAccountName(false), 2000);
    } catch (error) {
      console.error('Failed to copy account name:', error);
    }
  };

  // Detect if we're in Messenger's in-app browser
  const isMessengerBrowser = useMemo(() => {
    return /FBAN|FBAV/i.test(navigator.userAgent) || 
           /FB_IAB/i.test(navigator.userAgent);
  }, []);

  const handleDownloadQRCode = async (qrCodeUrl: string, paymentMethodName: string) => {
    // Only disable in Messenger's in-app browser
    // All external browsers (Chrome, Safari, Firefox, Edge, etc.) should work
    if (isMessengerBrowser) {
      // In Messenger, downloads don't work - users can long-press the QR code image
      return;
    }
    
    // For all external browsers, fetch and download as blob to force download
    // This approach works in Chrome, Safari, Firefox, Edge, Opera, and other modern browsers
    try {
      const response = await fetch(qrCodeUrl, {
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${paymentMethodName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.style.display = 'none';
      
      // Append to body, click, then remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try direct link with download attribute
      // This works in most browsers but may open instead of download in some cases
      try {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `qr-code-${paymentMethodName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    }
  };

  // Check for existing order on mount
  useEffect(() => {
    const checkExistingOrder = async () => {
      const storedOrderId = localStorage.getItem('current_order_id');
      if (storedOrderId) {
        const order = await fetchOrderById(storedOrderId);
        if (order) {
          setExistingOrderStatus(order.status);
          setOrderId(order.id);
          
          // Clear localStorage only if order is approved (succeeded)
          // Keep rejected orders so user can still view them
          if (order.status === 'approved') {
            localStorage.removeItem('current_order_id');
            setExistingOrderStatus(null);
            setOrderId(null);
          }
        } else {
          localStorage.removeItem('current_order_id');
        }
      }
      setIsCheckingExistingOrder(false);
    };

    checkExistingOrder();
  }, [fetchOrderById]);

  const handlePlaceOrder = () => {
    if (!paymentMethodUuid) {
      setReceiptError('Please select a payment method');
      return;
    }
    
    if (!receiptImageUrl) {
      setReceiptError('Please upload your payment receipt before placing the order');
      return;
    }

    const orderDetails = generateOrderMessage();
    const encodedMessage = encodeURIComponent(orderDetails);
    const messengerUrl = `https://m.me/779999235186541?text=${encodedMessage}`;
    
    window.open(messengerUrl, '_blank');
  };

  const handlePlaceOrderDirect = async () => {
    if (!paymentMethodUuid) {
      setReceiptError('Please select a payment method');
      return;
    }
    
    if (!receiptImageUrl) {
      setReceiptError('Please upload your payment receipt before placing the order');
      return;
    }

    if (!selectedPaymentMethod) {
      setReceiptError('Please select a payment method');
      return;
    }

    try {
      setIsPlacingOrder(true);
      setReceiptError(null);

      // Build customer info object
      const customerInfo: Record<string, string | unknown> = {};
      
      // Add payment method
      customerInfo['Payment Method'] = selectedPaymentMethod.name;

      // Single account mode (default)
      // Add custom fields
      if (hasAnyCustomFields) {
        itemsWithCustomFields.forEach((item) => {
          const originalId = getOriginalMenuItemId(item.id);
          item.customFields?.forEach((field, fieldIndex) => {
            // Use fieldIndex to ensure uniqueness even if field.key is duplicated
            const valueKey = `${originalId}_${fieldIndex}_${field.key}`;
            const value = customFieldValues[valueKey];
            if (value) {
              customerInfo[field.label] = value;
            }
          });
        });
      } else {
        // Default IGN field
        if (customFieldValues['default_ign']) {
          customerInfo['IGN'] = customFieldValues['default_ign'];
        }
      }

      // Create order
      const newOrder = await createOrder({
        order_items: cartItems,
        customer_info: customerInfo as Record<string, string | unknown>,
        payment_method_id: selectedPaymentMethod.uuid_id,
        receipt_url: receiptImageUrl,
        total_price: totalPrice,
      });

      if (newOrder) {
        setOrderId(newOrder.id);
        setExistingOrderStatus(newOrder.status);
        localStorage.setItem('current_order_id', newOrder.id);
        setIsOrderModalOpen(true);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setReceiptError('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const isDetailsValid = useMemo(() => {
    if (!hasAnyCustomFields) {
      // Default IGN field
      return customFieldValues['default_ign']?.trim() || false;
    }
    
    // Check all required fields for all items (use original menu item ID)
    return itemsWithCustomFields.every(item => {
      if (!item.customFields) return true;
      const originalId = getOriginalMenuItemId(item.id);
      return item.customFields.every((field, fieldIndex) => {
        if (!field.required) return true;
        // Use fieldIndex to ensure uniqueness even if field.key is duplicated
        const valueKey = `${originalId}_${fieldIndex}_${field.key}`;
        return customFieldValues[valueKey]?.trim() || false;
      });
    });
  }, [hasAnyCustomFields, itemsWithCustomFields, customFieldValues]);

  const renderOrderStatusModal = () => (
    <OrderStatusModal
      orderId={orderId}
      isOpen={isOrderModalOpen}
      onClose={() => {
        setIsOrderModalOpen(false);
        // Check order status when modal closes
        if (orderId) {
          fetchOrderById(orderId).then(order => {
            if (order) {
              setExistingOrderStatus(order.status);
              if (order.status === 'approved') {
                // Clear localStorage and state only for approved orders
                localStorage.removeItem('current_order_id');
                setExistingOrderStatus(null);
                setOrderId(null);
              }
              // For rejected orders, keep the IDs and localStorage so user can still view the order details
              // and the "Order Again" button will show
            }
          });
        }
      }}
      onSucceededClose={() => {
        localStorage.removeItem('current_order_id');
        setExistingOrderStatus(null);
        setOrderId(null);
        if (onNavigateToMenu) {
          onNavigateToMenu();
        }
      }}
    />
  );

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center justify-self-start text-cafe-textMuted hover:text-cafe-primary transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-semibold text-cafe-text text-center">Top Up</h1>
          <div aria-hidden="true" className="w-10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-cafe-primary text-white" aria-hidden="true">1</span>
              <h2 className="text-2xl font-medium text-cafe-text">Customer Information</h2>
            </div>
            
            <form className="space-y-6">
              {/* Bulk Input Section */}
              {itemsWithCustomFields.length >= 2 && (
                <div className="mb-6 p-4 glass-strong border border-cafe-primary/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-cafe-text mb-4">Bulk Input</h3>
                  <p className="text-sm text-cafe-textMuted mb-4">
                    Select games and fill fields once for all selected games.
                  </p>
                  
                  {/* Game Selection Checkboxes */}
                  <div className="space-y-2 mb-4">
                    {itemsWithCustomFields.map((item) => {
                      const originalId = getOriginalMenuItemId(item.id);
                      const isSelected = bulkSelectedGames.includes(originalId);
                      return (
                        <label
                          key={item.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleBulkGameSelectionChange(item.id, e.target.checked)}
                            className="w-4 h-4 text-cafe-primary border-cafe-primary/30 rounded focus:ring-cafe-primary"
                          />
                          <span className="text-sm text-cafe-text">{item.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Input Fields - Only show if games are selected */}
                  {bulkSelectedGames.length > 0 && bulkInputFields.length > 0 && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-cafe-primary/20">
                      {bulkInputFields.map(({ index, field }) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-cafe-text mb-2">
                            {field ? field.label : `Field ${index + 1}`} <span className="text-cafe-textMuted">(Bulk)</span> {field?.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={bulkInputValues[index.toString()] || ''}
                            onChange={(e) => handleBulkInputChange(index.toString(), e.target.value)}
                            className="w-full px-4 py-3 glass border border-cafe-primary/30 rounded-lg focus:ring-2 focus:ring-cafe-primary focus:border-cafe-primary transition-all duration-200 text-cafe-text placeholder-cafe-textMuted"
                            placeholder={field?.placeholder || field?.label || `Field ${index + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Custom Fields grouped by game */}
              {hasAnyCustomFields ? (
                itemsWithCustomFields.map((item, itemIndex) => (
                  <div key={item.id} className="space-y-4 pb-6 border-b border-cafe-primary/20 last:border-b-0 last:pb-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-cafe-text">{item.name}</h3>
                      <p className="text-sm text-cafe-textMuted">Please provide the following information for this game</p>
                    </div>
                    {item.customFields?.map((field, fieldIndex) => {
                      const originalId = getOriginalMenuItemId(item.id);
                      // Use fieldIndex to ensure uniqueness even if field.key is duplicated within the same game
                      const valueKey = `${originalId}_${fieldIndex}_${field.key}`;
                      const inputId = `input-${originalId}-${itemIndex}-${fieldIndex}-${field.key}`;
                      return (
                        <div key={`${item.id}-${fieldIndex}-${field.key}`}>
                          <label htmlFor={inputId} className="block text-sm font-medium text-cafe-text mb-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            id={inputId}
                            type="text"
                            name={valueKey}
                            autoComplete="off"
                            value={customFieldValues[valueKey] || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setCustomFieldValues(prev => ({
                                ...prev,
                                [valueKey]: newValue
                              }));
                            }}
                            className="w-full px-4 py-3 glass border border-cafe-primary/30 rounded-lg focus:ring-2 focus:ring-cafe-primary focus:border-cafe-primary transition-all duration-200 text-cafe-text placeholder-cafe-textMuted"
                            placeholder={field.placeholder || field.label}
                            required={field.required}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div>
                  <label className="block text-sm font-medium text-cafe-text mb-2">
                    IGN <span className="text-red-500">*</span>
                  </label>
                    <input
                      id="default-ign-input"
                      type="text"
                      name="default_ign"
                      autoComplete="off"
                      value={customFieldValues['default_ign'] || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setCustomFieldValues(prev => ({
                          ...prev,
                          ['default_ign']: newValue
                        }));
                      }}
                      className="w-full px-4 py-3 glass border border-cafe-primary/30 rounded-lg focus:ring-2 focus:ring-cafe-primary focus:border-cafe-primary transition-all duration-200 text-cafe-text placeholder-cafe-textMuted"
                      placeholder="In game name"
                      required
                    />
                </div>
              )}

            </form>
          </div>
        </div>

        <hr className="border-0 border-t border-cafe-primary/20 my-2" aria-hidden="true" />

        {/* Single-page: Payment method selection (tarchier-style) */}
        <div className="p-6 mt-2" ref={paymentDetailsRef}>
          <div className="flex items-center gap-3 mb-6">
            <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-cafe-primary text-white" aria-hidden="true">2</span>
            <h2 className="text-2xl font-medium text-cafe-text">Choose Payment Method</h2>
          </div>
          <div className="grid grid-cols-6 gap-2 md:gap-3 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.uuid_id}
                type="button"
                aria-label={method.name}
                onClick={() => {
                  setPaymentMethodUuid(method.uuid_id);
                  setShowPaymentDetailsModal(true);
                }}
                className={`w-10 h-10 md:w-12 md:h-12 p-0 rounded-xl border-2 transition-all duration-200 flex items-center justify-center overflow-hidden ${
                  paymentMethodUuid === method.uuid_id ? 'border-transparent text-white' : 'glass border-cafe-primary/30 text-cafe-text hover:border-cafe-primary hover:glass-strong'
                }`}
                style={paymentMethodUuid === method.uuid_id ? { backgroundColor: '#DC2626' } : {}}
              >
                {method.icon_url ? (
                  <img src={method.icon_url} alt={method.name} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cafe-darkCard to-cafe-darkBg">
                    <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-cafe-textMuted" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="glass border border-cafe-primary/30 rounded-lg p-4">
            <p className="text-sm text-cafe-textMuted">
              Pay using any of the methods above → screenshot the receipt → then send to our Messenger after submitting your order.
            </p>
          </div>
        </div>

        <hr className="border-0 border-t border-cafe-primary/20 my-2" aria-hidden="true" />

        {/* Receipt Upload and Place Order (single page - no order summary column) */}
        <div className="p-6 mt-2" ref={buttonsRef}>
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-cafe-primary text-white" aria-hidden="true">3</span>
              <h2 className="text-2xl font-medium text-cafe-text">Payment Receipt</h2>
            </div>
            
            {/* Receipt Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-cafe-text mb-2">
                Payment Receipt <span className="text-red-400">*</span>
              </label>
              
              {!receiptPreview ? (
                <div className="relative glass border-2 border-dashed border-cafe-primary/30 rounded-lg p-6 text-center hover:border-cafe-primary transition-colors duration-200">
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-cafe-primary text-white">
                    1
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleReceiptUpload(file);
                      }
                    }}
                    className="hidden"
                    id="receipt-upload"
                    disabled={uploadingReceipt}
                  />
                  <label
                    htmlFor="receipt-upload"
                    className={`cursor-pointer flex flex-col items-center space-y-2 ${uploadingReceipt ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingReceipt ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-primary"></div>
                        <span className="text-sm text-cafe-textMuted">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-cafe-primary" />
                        <span className="text-sm text-cafe-text">Click to upload receipt</span>
                        <span className="text-xs text-cafe-textMuted">JPEG, PNG, WebP, or GIF (Max 5MB)</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="relative glass border border-cafe-primary/30 rounded-lg p-4">
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-cafe-primary text-white">
                    1
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="w-20 h-20 object-cover rounded-lg border border-cafe-primary/30"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cafe-text truncate">
                        {receiptFile?.name || 'Receipt uploaded'}
                      </p>
                      <p className="text-xs text-cafe-textMuted">
                        {receiptImageUrl ? '✓ Uploaded successfully' : 'Uploading...'}
                      </p>
                    </div>
                    <button
                      onClick={handleReceiptRemove}
                      className="flex-shrink-0 p-2 glass-strong rounded-lg hover:bg-red-500/20 transition-colors duration-200"
                      disabled={uploadingReceipt}
                    >
                      <X className="h-4 w-4 text-cafe-text" />
                    </button>
                  </div>
                </div>
              )}

              {receiptError && (
                <p className="mt-2 text-sm text-red-400">{receiptError}</p>
              )}
            </div>

            <div>
              {/* Copy button - only show for order_via_messenger */}
              {orderOption === 'order_via_messenger' && (
                <button
                  onClick={handleCopyMessage}
                  disabled={uploadingReceipt || !paymentMethodUuid || !receiptImageUrl}
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-200 transform mb-3 flex items-center justify-center space-x-2 ${
                    !uploadingReceipt && paymentMethodUuid && receiptImageUrl
                      ? 'glass border border-cafe-primary/30 text-cafe-text hover:border-cafe-primary hover:glass-strong'
                      : 'glass border border-cafe-primary/20 text-cafe-textMuted cursor-not-allowed'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      <span>Copy Order Message</span>
                    </>
                  )}
                </button>
              )}

              {/* Order placement buttons - different based on order_option */}
              {orderOption === 'place_order' ? (
                <>
                  {/* Direct Order Placement */}
                  {existingOrderStatus && existingOrderStatus !== 'approved' && existingOrderStatus !== 'rejected' && (
                    <button
                      onClick={() => setIsOrderModalOpen(true)}
                      className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform text-white hover:opacity-90 hover:scale-[1.02]"
                      style={{ backgroundColor: '#DC2626' }}
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-cafe-primary text-white">
                        2
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="h-5 w-5" />
                        View Order
                      </div>
                    </button>
                  )}
                  {(!existingOrderStatus || existingOrderStatus === 'rejected') && (
                    <button
                      onClick={handlePlaceOrderDirect}
                      disabled={!paymentMethodUuid || !receiptImageUrl || uploadingReceipt || isPlacingOrder}
                      className={`relative w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                        paymentMethodUuid && receiptImageUrl && !uploadingReceipt && !isPlacingOrder
                          ? 'text-white hover:opacity-90 hover:scale-[1.02]'
                          : 'glass text-cafe-textMuted cursor-not-allowed'
                      }`}
                      style={paymentMethodUuid && receiptImageUrl && !uploadingReceipt && !isPlacingOrder ? { backgroundColor: '#DC2626' } : {}}
                    >
                      <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        paymentMethodUuid && receiptImageUrl && !uploadingReceipt && !isPlacingOrder
                          ? 'bg-cafe-primary text-white'
                          : 'bg-cafe-textMuted/30 text-cafe-textMuted'
                      }`}>
                        2
                      </div>
                      {isPlacingOrder ? 'Placing Order...' : existingOrderStatus === 'rejected' ? 'Order Again' : 'Place Order'}
                    </button>
                  )}
                  <p className="text-xs text-cafe-textMuted text-center mt-3">
                    Your order will be processed directly. You can track its status after placing the order.
                  </p>
                </>
              ) : (
                <>
                  {/* Messenger Order Placement */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!paymentMethodUuid || !receiptImageUrl || uploadingReceipt || !hasCopiedMessage}
                    className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                      paymentMethodUuid && receiptImageUrl && !uploadingReceipt && hasCopiedMessage
                        ? 'text-white hover:opacity-90 hover:scale-[1.02]'
                        : 'glass text-cafe-textMuted cursor-not-allowed'
                    }`}
                    style={paymentMethodUuid && receiptImageUrl && !uploadingReceipt && hasCopiedMessage ? { backgroundColor: '#DC2626' } : {}}
                  >
                    {uploadingReceipt ? 'Uploading Receipt...' : 'Place Order via Messenger'}
                  </button>
                  
                  <p className="text-xs text-cafe-textMuted text-center mt-3">
                    You'll be redirected to Facebook Messenger to confirm your order. Your receipt has been uploaded and will be included in the message.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

      {/* Payment Details Modal (tarchier-style) */}
      {showPaymentDetailsModal && selectedPaymentMethod && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowPaymentDetailsModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Payment details"
        >
          <div
            className="glass-strong rounded-xl p-6 max-w-md w-full border border-cafe-primary/30 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-cafe-text">Payment Details</h3>
              <button
                type="button"
                onClick={() => setShowPaymentDetailsModal(false)}
                className="p-1.5 glass-strong rounded-lg hover:bg-cafe-primary/20 transition-colors duration-200"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-cafe-text" />
              </button>
            </div>
            <p className="text-sm text-cafe-textMuted mb-4">
              Press the copy button to copy the number or download the QR code, make a payment, then proceed to place your order.
            </p>
            <p className="text-lg font-semibold text-cafe-text mb-2">{selectedPaymentMethod.name}</p>
            <p className="text-xl font-semibold text-cafe-text mb-4">₱{totalPrice}</p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-cafe-textMuted">Number:</span>
                <button
                  type="button"
                  onClick={() => handleCopyAccountNumber(selectedPaymentMethod.account_number)}
                  className="p-1.5 glass-strong rounded-lg hover:bg-cafe-primary/20 text-sm font-medium text-cafe-text flex items-center gap-2"
                  title="Copy account number"
                >
                  {copiedAccountNumber ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {selectedPaymentMethod.account_number}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-cafe-textMuted">Name:</span>
                <button
                  type="button"
                  onClick={() => handleCopyAccountName(selectedPaymentMethod.account_name)}
                  className="p-1.5 glass-strong rounded-lg hover:bg-cafe-primary/20 text-sm font-medium text-cafe-text flex items-center gap-2"
                  title="Copy account name"
                >
                  {copiedAccountName ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {selectedPaymentMethod.account_name}
                </button>
              </div>
            </div>
            <div className="pt-3 border-t border-cafe-primary/20 flex flex-col items-center">
              <p className="text-sm text-cafe-textMuted mb-3">Other Option</p>
              {selectedPaymentMethod.qr_code_url ? (
                <>
                  {!isMessengerBrowser && (
                    <button
                      type="button"
                      onClick={() => handleDownloadQRCode(selectedPaymentMethod.qr_code_url, selectedPaymentMethod.name)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 glass-strong rounded-lg hover:bg-cafe-primary/20 text-cafe-text font-medium mb-3"
                      title="Download QR code"
                    >
                      <Download className="h-4 w-4" />
                      Download QR
                    </button>
                  )}
                  {isMessengerBrowser && <p className="text-xs text-cafe-textMuted mb-3 text-center">Long-press the QR code to save</p>}
                  <img
                    src={selectedPaymentMethod.qr_code_url}
                    alt={`${selectedPaymentMethod.name} QR`}
                    className="w-32 h-32 rounded-lg border-2 border-cafe-primary/30 mx-auto block"
                  />
                </>
              ) : (
                <p className="text-sm text-cafe-textMuted">No QR Code Available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {renderOrderStatusModal()}
    </>
  );
};

export default Checkout;