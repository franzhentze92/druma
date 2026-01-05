import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  client_city: string | null;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  status: string;
  issued_at: string;
  paid_at: string | null;
  notes: string | null;
}

interface OrderItem {
  id: string;
  item_name: string;
  item_description?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  currency: string;
  provider_name: string;
}

interface InvoiceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ isOpen, onClose, orderId }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchInvoice();
    }
  }, [isOpen, orderId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      
      // Fetch invoice using maybeSingle() to handle case when invoice doesn't exist
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        // Check if it's a "table doesn't exist" error
        if (invoiceError.code === 'PGRST116' || invoiceError.message.includes('does not exist')) {
          console.warn('Invoices table may not exist. Please run the supabase_invoices_table.sql script.');
        }
        setInvoice(null);
      } else if (!invoiceData) {
        console.warn('No invoice found for order:', orderId);
        setInvoice(null);
      } else {
        setInvoice(invoiceData);
      }

      // Fetch order items (this should always work if order exists)
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        setOrderItems([]);
      } else {
        setOrderItems(itemsData || []);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching invoice:', error);
      setInvoice(null);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return `${currency === 'GTQ' ? 'Q.' : '$'}${amount.toFixed(2)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simply trigger print which allows user to save as PDF
    handlePrint();
  };

  // This function is kept for potential future use but currently not used
  const generateInvoiceHTML = () => {
    if (!invoice) return '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
      background: white;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366f1;
    }
    .company-info h1 {
      color: #6366f1;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .company-info p {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #333;
    }
    .invoice-info p {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .billing-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .billing-section {
      flex: 1;
    }
    .billing-section h3 {
      font-size: 16px;
      margin-bottom: 10px;
      color: #333;
      text-transform: uppercase;
    }
    .billing-section p {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background-color: #f3f4f6;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #666;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.total {
      font-size: 18px;
      font-weight: bold;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      color: #333;
    }
    .payment-info {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .payment-info p {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>PetHub</h1>
        <p>Plataforma Integral para el Cuidado de Mascotas</p>
        <p>Guatemala</p>
        <p>info@pethub.gt</p>
      </div>
      <div class="invoice-info">
        <h2>FACTURA</h2>
        <p><strong>Número:</strong> ${invoice.invoice_number}</p>
        <p><strong>Fecha:</strong> ${format(new Date(invoice.issued_at), "dd 'de' MMMM, yyyy", { locale: es })}</p>
        <p><strong>Orden:</strong> #${orderId.substring(0, 8)}</p>
      </div>
    </div>

    <div class="billing-info">
      <div class="billing-section">
        <h3>Facturar a:</h3>
        <p><strong>${invoice.client_name}</strong></p>
        ${invoice.client_email ? `<p>${invoice.client_email}</p>` : ''}
        ${invoice.client_phone ? `<p>${invoice.client_phone}</p>` : ''}
        ${invoice.client_address ? `<p>${invoice.client_address}</p>` : ''}
        ${invoice.client_city ? `<p>${invoice.client_city}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Producto/Servicio</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map(item => `
          <tr>
            <td>
              <strong>${item.item_name}</strong>
              ${item.item_description ? `<br><small style="color: #999;">${item.item_description}</small>` : ''}
              <br><small style="color: #999;">Proveedor: ${item.provider_name}</small>
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatPrice(item.unit_price, item.currency)}</td>
            <td class="text-right"><strong>${formatPrice(item.total_price, item.currency)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatPrice(invoice.subtotal, invoice.currency)}</span>
      </div>
      ${invoice.delivery_fee > 0 ? `
      <div class="total-row">
        <span>Envío:</span>
        <span>${formatPrice(invoice.delivery_fee, invoice.currency)}</span>
      </div>
      ` : ''}
      ${invoice.tax_amount > 0 ? `
      <div class="total-row">
        <span>Impuestos:</span>
        <span>${formatPrice(invoice.tax_amount, invoice.currency)}</span>
      </div>
      ` : ''}
      ${invoice.discount_amount > 0 ? `
      <div class="total-row">
        <span>Descuento:</span>
        <span>-${formatPrice(invoice.discount_amount, invoice.currency)}</span>
      </div>
      ` : ''}
      <div class="total-row total">
        <span>TOTAL:</span>
        <span>${formatPrice(invoice.total_amount, invoice.currency)}</span>
      </div>
    </div>

    <div class="payment-info">
      <p><strong>Método de Pago:</strong> ${getPaymentMethodName(invoice.payment_method)}</p>
      <p><strong>Estado de Pago:</strong> ${getPaymentStatusName(invoice.payment_status)}</p>
      ${invoice.paid_at ? `
      <p><strong>Fecha de Pago:</strong> ${format(new Date(invoice.paid_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
      ` : ''}
    </div>

    ${invoice.notes ? `
    <div class="payment-info">
      <p><strong>Notas:</strong></p>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Gracias por tu compra. Esta es una factura generada automáticamente.</p>
      <p>Para consultas, contacta a info@pethub.gt</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'card': 'Tarjeta de Crédito/Débito',
      'cash': 'Efectivo',
      'transfer': 'Transferencia Bancaria'
    };
    return methods[method] || method;
  };

  const getPaymentStatusName = (status: string) => {
    const statuses: { [key: string]: string } = {
      'completed': 'Completado',
      'pending': 'Pendiente',
      'failed': 'Fallido'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cargando Factura</DialogTitle>
            <DialogDescription>Obteniendo información de la factura...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!loading && !invoice) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Factura no encontrada</DialogTitle>
            <DialogDescription>No se encontró una factura para esta orden.</DialogDescription>
          </DialogHeader>
          <div className="py-12 text-center space-y-4">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-600 text-lg">
              No se encontró una factura para esta orden.
            </p>
            <p className="text-gray-500 text-sm">
              Esto puede ocurrir si:
            </p>
            <ul className="text-gray-500 text-sm text-left max-w-md mx-auto list-disc list-inside space-y-1">
              <li>La orden fue creada antes de implementar el sistema de facturas</li>
              <li>La tabla de facturas aún no ha sido creada en la base de datos</li>
              <li>Hubo un error al generar la factura durante la compra</li>
            </ul>
            <div className="pt-4">
              <Button onClick={onClose} variant="outline">Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return null; // Still loading
  }

  const InvoiceContent = () => (
    <div className="bg-white p-8" id="invoice-content">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .invoice-content { box-shadow: none; }
        }
        .invoice-content {
          font-family: Arial, sans-serif;
          color: #333;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #6366f1;
        }
        .company-info h1 {
          color: #6366f1;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .company-info p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #333;
        }
        .invoice-info p {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .billing-section {
          margin-bottom: 30px;
        }
        .billing-section h3 {
          font-size: 16px;
          margin-bottom: 10px;
          color: #333;
          text-transform: uppercase;
        }
        .billing-section p {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
          line-height: 1.6;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .invoice-table thead {
          background-color: #f3f4f6;
        }
        .invoice-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e5e7eb;
        }
        .invoice-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #666;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          margin-left: auto;
          width: 300px;
          margin-bottom: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.total {
          font-size: 18px;
          font-weight: bold;
          padding-top: 15px;
          border-top: 2px solid #e5e7eb;
          color: #333;
        }
        .payment-info {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .payment-info p {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .invoice-footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      `}</style>
      
      <div className="invoice-content">
        <div className="invoice-header">
          <div className="company-info">
            <h1>PetHub</h1>
            <p>Plataforma Integral para el Cuidado de Mascotas</p>
            <p>Guatemala</p>
            <p>info@pethub.gt</p>
          </div>
          <div className="invoice-info">
            <h2>FACTURA</h2>
            <p><strong>Número:</strong> {invoice.invoice_number}</p>
            <p><strong>Fecha:</strong> {format(new Date(invoice.issued_at), "dd 'de' MMMM, yyyy", { locale: es })}</p>
            <p><strong>Orden:</strong> #{orderId.substring(0, 8)}</p>
          </div>
        </div>

        <div className="billing-section">
          <h3>Facturar a:</h3>
          <p><strong>{invoice.client_name}</strong></p>
          {invoice.client_email && <p>{invoice.client_email}</p>}
          {invoice.client_phone && <p>{invoice.client_phone}</p>}
          {invoice.client_address && <p>{invoice.client_address}</p>}
          {invoice.client_city && <p>{invoice.client_city}</p>}
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Producto/Servicio</th>
              <th className="text-right">Cantidad</th>
              <th className="text-right">Precio Unit.</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map(item => (
              <tr key={item.id}>
                <td>
                  <strong>{item.item_name}</strong>
                  {item.item_description && (
                    <>
                      <br />
                      <small style={{ color: '#999' }}>{item.item_description}</small>
                    </>
                  )}
                  <br />
                  <small style={{ color: '#999' }}>Proveedor: {item.provider_name}</small>
                </td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{formatPrice(item.unit_price, item.currency)}</td>
                <td className="text-right"><strong>{formatPrice(item.total_price, item.currency)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>{formatPrice(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.delivery_fee > 0 && (
            <div className="total-row">
              <span>Envío:</span>
              <span>{formatPrice(invoice.delivery_fee, invoice.currency)}</span>
            </div>
          )}
          {invoice.tax_amount > 0 && (
            <div className="total-row">
              <span>Impuestos:</span>
              <span>{formatPrice(invoice.tax_amount, invoice.currency)}</span>
            </div>
          )}
          {invoice.discount_amount > 0 && (
            <div className="total-row">
              <span>Descuento:</span>
              <span>-{formatPrice(invoice.discount_amount, invoice.currency)}</span>
            </div>
          )}
          <div className="total-row total">
            <span>TOTAL:</span>
            <span>{formatPrice(invoice.total_amount, invoice.currency)}</span>
          </div>
        </div>

        <div className="payment-info">
          <p><strong>Método de Pago:</strong> {getPaymentMethodName(invoice.payment_method)}</p>
          <p><strong>Estado de Pago:</strong> {getPaymentStatusName(invoice.payment_status)}</p>
          {invoice.paid_at && (
            <p><strong>Fecha de Pago:</strong> {format(new Date(invoice.paid_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
          )}
        </div>

        {invoice.notes && (
          <div className="payment-info">
            <p><strong>Notas:</strong></p>
            <p>{invoice.notes}</p>
          </div>
        )}

        <div className="invoice-footer">
          <p>Gracias por tu compra. Esta es una factura generada automáticamente.</p>
          <p>Para consultas, contacta a info@pethub.gt</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto no-print">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Factura {invoice.invoice_number}</DialogTitle>
                <DialogDescription>Orden #{orderId.substring(0, 8)}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button onClick={handlePrint} variant="outline" size="sm">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </DialogHeader>
          <InvoiceContent />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceViewer;

