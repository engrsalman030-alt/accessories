import React, { useEffect } from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import useSettingStore from '../../store/settingStore';
import PrintFooter from '../common/PrintFooter';

const InvoicePrint = ({ data, type = 'sale' }) => {
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  if (!data) return null;

  const isReturn = type.includes('return');
  const titleLabel = isReturn ? 'RETURN CREDIT NOTE' : `${type.toUpperCase()} INVOICE`;
  const partyLabel = type === 'purchase' || type === 'purchase_return' ? 'Supplier:' : 'Customer:';
  const partyName = type === 'purchase' || type === 'purchase_return' 
    ? (data.supplier?.name || data.supplier_name || 'Unknown') 
    : (data.customer?.name || data.customer_name || 'Walk-in');
  
  const idPrefix = type === 'sale' ? 'INV' : type === 'purchase' ? 'PUR' : type === 'sale_return' ? 'SR' : 'PR';
  const printerType = settings?.printer_type || 'thermal';

  return (
    <div id="printable-invoice" className="hidden print:block font-sans text-slate-900 bg-white">
      {/* 1. THERMAL LAYOUT (80mm) */}
      {printerType === 'thermal' && (
        <div className="w-[80mm] p-2 text-[11px] leading-tight mx-auto">
          {/* Header */}
          <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-slate-800">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-800 overflow-hidden">
                {settings?.logo_url ? (
                  <img 
                    src={settings.logo_url.startsWith('http') ? settings.logo_url : `http://127.0.0.1:8000${settings.logo_url}`} 
                    alt="Shop Logo" 
                    className="w-full h-full object-contain p-1" 
                  />
                ) : (
                  <CubeIcon className="w-6 h-6 text-slate-800" />
                )}
              </div>
            </div>
            <h1 className="text-lg font-black uppercase tracking-widest mb-1">{settings?.shop_name || 'Your Shop'}</h1>
            <p className="font-medium">{settings?.address}</p>
            <p className="font-medium">{settings?.phone}</p>
          </div>

          {/* Info */}
          <div className="mb-4 space-y-1">
            <h2 className="font-black text-center text-[10px] uppercase tracking-widest mb-2 border-b border-slate-800 inline-block px-4">{titleLabel}</h2>
            <div className="flex justify-between font-bold">
              <span>Reference #:</span>
              <span>{idPrefix}-{data.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(data.date || new Date()).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between">
              <span>{partyLabel}</span>
              <span className="font-bold text-right truncate max-w-[120px]">{partyName}</span>
            </div>
            {isReturn && data.reason && (
              <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] italic">
                <strong>Reason:</strong> {data.reason}
              </div>
            )}
          </div>

          {/* Table */}
          <table className="w-full border-collapse mb-4">
            <thead className="border-y-2 border-slate-800">
              <tr>
                <th className="text-left py-1.5">Item</th>
                <th className="text-center py-1.5 w-12">Qty</th>
                <th className="text-right py-1.5">Total</th>
              </tr>
            </thead>
            <tbody className="border-b-2 border-slate-800">
              {(data.items || []).map((item, i) => (
                <tr key={i} className="align-top border-b border-dashed border-slate-300 last:border-0">
                  <td className="py-2 pr-1">
                    <div className="font-bold">{item.product?.name || item.product_name || item.name}</div>
                    <div className="text-[9px] text-slate-500">@ {Number(item.unit_price || item.unit_cost || 0).toFixed(2)}</div>
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2 font-bold">{(item.quantity * Number(item.unit_price || item.unit_cost || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1.5 text-right mb-6">
            <div className="flex justify-between font-black text-base py-1 border-y-2 border-slate-800 my-1">
              <span>{isReturn ? 'REFUND' : 'TOTAL'} {settings?.currency}:</span>
              <span>{Number(data.total_refund_amount || data.total_amount || 0).toFixed(2)}</span>
            </div>
            {!isReturn && (
              <>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>PAID:</span>
                  <span>{Number(data.amount_paid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-800">
                  <span>DUE:</span>
                  <span>{(Number(data.total_amount || 0) - Number(data.amount_paid || 0)).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="font-black text-xs uppercase mb-1">{isReturn ? 'Return Receipt' : 'Thank You!'}</p>
            <PrintFooter className="border-t border-dashed pt-4" />
          </div>
        </div>
      )}

      {/* 2. STANDARD A4 LAYOUT */}
      {printerType === 'standard' && (
        <div className="max-w-[190mm] mx-auto p-0 bg-white">
          {/* Header A4 */}
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                {settings?.logo_url ? (
                  <img 
                    src={settings.logo_url.startsWith('http') ? settings.logo_url : `http://127.0.0.1:8000${settings.logo_url}`} 
                    alt="Shop Logo" 
                    className="w-full h-full object-contain p-1" 
                  />
                ) : (
                  <CubeIcon className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{settings?.shop_name}</h1>
                <p className="text-slate-500 font-bold max-w-xs text-[10px] mt-1 leading-tight">{settings?.address}</p>
                <div className="flex gap-3 mt-2 text-[9px] font-bold text-slate-700">
                  <span>Tel: {settings?.phone}</span>
                  <span>{settings?.email}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-1 min-w-[200px]">
              <h2 className="text-3xl font-black text-slate-200 uppercase tracking-tighter -mt-1 opacity-50">{isReturn ? 'Return' : type}</h2>
              <div className="mt-1 space-y-0.5">
                <p className="text-base font-black text-slate-900 whitespace-nowrap">{titleLabel}</p>
                <p className="text-slate-500 font-bold text-[10px]"># {idPrefix}-{data.id}</p>
              </div>
            </div>
          </div>

          {/* Party Info A4 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Billed To</p>
              <h3 className="text-lg font-black text-slate-900">{partyName}</h3>
              <p className="text-slate-500 font-bold text-[10px]">Ref Transaction: {idPrefix}-{data.id}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Transaction Date</p>
              <h3 className="text-lg font-black text-slate-900">
                {new Date(data.date || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-slate-500 font-bold text-[10px]">Time: {new Date(data.date || new Date()).toLocaleTimeString()}</p>
            </div>
          </div>

          {isReturn && data.reason && (
             <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-[8px] font-black uppercase text-amber-600 tracking-widest mb-0.5">Return Reason</p>
                <p className="text-sm font-bold text-amber-900 italic">"{data.reason}"</p>
             </div>
          )}

          {/* Table A4 */}
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2 px-3 text-left rounded-l-xl font-black uppercase text-[9px] tracking-widest">Description</th>
                <th className="py-2 px-3 text-center font-black uppercase text-[9px] tracking-widest">Qty</th>
                <th className="py-2 px-3 text-right font-black uppercase text-[9px] tracking-widest">Unit Rate</th>
                <th className="py-2 px-3 text-right rounded-r-xl font-black uppercase text-[9px] tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.items || []).map((item, i) => {
                const price = Number(item.unit_price || item.unit_cost || 0);
                const total = item.quantity * price;
                return (
                  <tr key={i} className="page-break-inside-avoid">
                    <td className="py-2 px-3">
                      <p className="font-black text-slate-900 text-sm">{item.product?.name || item.product_name || item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">SKU: {item.product?.sku || 'N/A'}</p>
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-black text-primary-600">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-xs font-bold text-slate-600">{price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-sm font-black text-slate-900">{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals A4 */}
          <div className="flex justify-end pt-4 border-t-2 border-slate-100">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-slate-500 font-bold text-xs px-2">
                <span>Subtotal</span>
                <span>{settings?.currency} {Number(data.total_refund_amount || data.subtotal || data.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl">
                <span className="font-black uppercase tracking-widest text-[9px]">{isReturn ? 'Refund Amount' : 'Grand Total'}</span>
                <span className="text-xl font-black">{settings?.currency} {Number(data.total_refund_amount || data.total_amount || 0).toFixed(2)}</span>
              </div>
              {!isReturn && (
                <>
                  <div className="flex justify-between p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-black text-xs">
                    <span className="uppercase text-[8px]">Amount Paid</span>
                    <span>{settings?.currency} {Number(data.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 font-black text-xs">
                    <span className="uppercase text-[8px]">Balance Due</span>
                    <span>{settings?.currency} {(Number(data.total_amount || 0) - Number(data.amount_paid || 0)).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-12 text-center border-t border-slate-100 pt-6">
            <p className="text-base font-black text-slate-900 uppercase tracking-widest">{isReturn ? 'Credit Note Issued' : 'Thank You For Your Business!'}</p>
            <p className="text-slate-400 font-bold mt-1 text-[10px]">Computer generated receipt. Signature not required.</p>
            <div className="mt-6">
               <PrintFooter />
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            height: auto !important;
            overflow: visible !important;
          }
          .page-break-inside-avoid { page-break-inside: avoid; }
          @page { 
            margin: 5mm;
            size: ${printerType === 'thermal' ? '80mm auto' : 'A4 portrait'};
          }
        }
      `}} />
    </div>
  );
};

export default InvoicePrint;
