import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PrintWorkOrderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: wo } = await supabase
    .from("work_orders")
    .select("*, projects(name, client_name, site_address), subcontractors(name, phone, gst, pan, bank_account, bank_ifsc, bank_name)")
    .eq("id", params.id)
    .single();

  if (!wo) notFound();

  const { data: items } = await supabase
    .from("work_order_items")
    .select("*")
    .eq("work_order_id", params.id)
    .order("created_at");

  const { data: company } = await supabase
    .from("companies")
    .select("name, address, phone, email, gst")
    .single();

  const totalAmount = (items || []).reduce((sum, item) => sum + (item.amount || ((item.rate || 0) * (item.quantity || 0))), 0);

  return (
    <html>
      <head>
        <title>Work Order — {wo.title}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a3a5a; }
          .company-name { font-size: 22px; font-weight: 800; color: #1a3a5a; letter-spacing: -0.5px; }
          .company-details { font-size: 10px; color: #666; margin-top: 2px; }
          .wo-badge { background: #1a3a5a; color: #fff; padding: 8px 16px; border-radius: 6px; text-align: right; }
          .wo-badge .label { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; }
          .wo-badge .status { font-size: 13px; font-weight: 700; margin-top: 2px; text-transform: uppercase; }
          .section { margin-bottom: 18px; }
          .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .field { margin-bottom: 8px; }
          .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 2px; }
          .field-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #1a3a5a; color: #fff; }
          thead th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          tbody tr:nth-child(even) { background: #f8f9fa; }
          tbody td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
          tfoot tr { background: #f0f4f8; font-weight: 700; }
          tfoot td { padding: 10px; border-top: 2px solid #1a3a5a; }
          .amount { text-align: right; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
          .sign-box { text-align: center; }
          .sign-line { width: 160px; border-top: 1px solid #1a1a1a; margin: 0 auto 4px; margin-top: 40px; }
          .sign-label { font-size: 10px; color: #666; }
          @media print { body { padding: 16px; } button { display: none !important; } }
        `}</style>
      </head>
      <body>
        {/* Print Button — hidden on print */}
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <button onClick={() => window.print()}
            style={{ background: '#1a3a5a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
            🖨 Print / Save as PDF
          </button>
        </div>

        {/* Letterhead */}
        <div className="header">
          <div>
            <div className="company-name">{company?.name ?? "SolidStonne"}</div>
            <div className="company-details">
              {company?.address && <span>{company.address}<br /></span>}
              {company?.phone && <span>📞 {company.phone}  </span>}
              {company?.email && <span>✉ {company.email}<br /></span>}
              {company?.gst && <span>GSTIN: {company.gst}</span>}
            </div>
          </div>
          <div className="wo-badge">
            <div className="label">Work Order</div>
            <div className="status">{wo.status}</div>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
              {wo.start_date && `${new Date(wo.start_date).toLocaleDateString('en-IN')} – `}
              {wo.end_date && new Date(wo.end_date).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* WO Details */}
        <div className="section">
          <div className="section-title">Work Order Details</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{wo.title}</div>
          <div className="grid-2">
            <div>
              <div className="field">
                <div className="field-label">Project</div>
                <div className="field-value">{(wo.projects as any)?.name}</div>
              </div>
              <div className="field">
                <div className="field-label">Billing Type</div>
                <div className="field-value" style={{ textTransform: 'capitalize' }}>{wo.billing_type?.replace('_', ' ')}</div>
              </div>
              {wo.scope && (
                <div className="field">
                  <div className="field-label">Scope of Work</div>
                  <div className="field-value" style={{ fontSize: 11, fontWeight: 400, color: '#555' }}>{wo.scope}</div>
                </div>
              )}
            </div>
            <div>
              <div className="field">
                <div className="field-label">Subcontractor</div>
                <div className="field-value">{(wo.subcontractors as any)?.name}</div>
                {(wo.subcontractors as any)?.phone && <div style={{ fontSize: 10, color: '#666' }}>📞 {(wo.subcontractors as any).phone}</div>}
              </div>
              {(wo.subcontractors as any)?.gst && (
                <div className="field">
                  <div className="field-label">Contractor GST</div>
                  <div className="field-value" style={{ fontFamily: 'monospace' }}>{(wo.subcontractors as any).gst}</div>
                </div>
              )}
              {wo.total_value && (
                <div className="field">
                  <div className="field-label">Total Work Order Value</div>
                  <div className="field-value" style={{ fontSize: 15, color: '#1a3a5a' }}>₹{wo.total_value.toLocaleString('en-IN')}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        {items && items.length > 0 && (
          <div className="section">
            <div className="section-title">Bill of Quantities (BOQ)</div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th className="amount">Qty</th>
                  <th className="amount">Rate (₹)</th>
                  <th className="amount">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const amt = item.amount || ((item.rate || 0) * (item.quantity || 0));
                  return (
                    <tr key={item.id}>
                      <td style={{ color: '#999' }}>{idx + 1}</td>
                      <td>{item.description}</td>
                      <td>{item.unit ?? '—'}</td>
                      <td className="amount">{item.quantity ?? '—'}</td>
                      <td className="amount">{item.rate ? item.rate.toLocaleString('en-IN') : '—'}</td>
                      <td className="amount" style={{ fontWeight: 600 }}>{amt ? amt.toLocaleString('en-IN') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', paddingRight: 10 }}>Grand Total</td>
                  <td className="amount" style={{ fontSize: 14, color: '#1a3a5a' }}>₹{totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Penalty Clause */}
        {wo.penalty_clause && (
          <div className="section" style={{ background: '#fef3f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px' }}>
            <div className="section-title" style={{ color: '#991b1b', borderColor: '#fecaca' }}>Penalty Clause</div>
            <div style={{ fontSize: 11, color: '#7f1d1d' }}>{wo.penalty_clause}</div>
          </div>
        )}

        {/* Signatures */}
        <div className="footer">
          <div className="sign-box">
            <div className="sign-line" />
            <div className="sign-label">Contractor Signature & Stamp</div>
            <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{(wo.subcontractors as any)?.name}</div>
          </div>
          <div className="sign-box">
            <div className="sign-line" />
            <div className="sign-label">Authorized Signatory</div>
            <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{company?.name ?? 'SolidStonne'}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 9, color: '#ccc' }}>
          Generated by SolidStonne ERP • {new Date().toLocaleDateString('en-IN')}
        </div>
      </body>
    </html>
  );
}
