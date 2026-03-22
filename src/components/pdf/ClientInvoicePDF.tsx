import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1C1C1C'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  companyDetails: {
    color: '#6B7280',
    fontSize: 9,
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  metaLabel: {
    color: '#6B7280',
    width: 60,
  },
  metaValue: {
    fontWeight: 'bold',
    textAlign: 'right',
  },
  billToSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  // ITEMS TABLE
  table: {
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold',
  },
  colNo: { width: '8%', padding: 6, textAlign: 'center' },
  colDesc: { width: '42%', padding: 6 },
  colQty: { width: '15%', padding: 6, textAlign: 'right' },
  colRate: { width: '15%', padding: 6, textAlign: 'right' },
  colAmount: { width: '20%', padding: 6, textAlign: 'right' },
  
  // TOTALS
  totalsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  notes: {
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    color: '#6B7280',
    fontSize: 9,
  }
});

interface ClientInvoicePDFProps {
  invoice: any; 
  companyName: string;
}

export const ClientInvoicePDF: React.FC<ClientInvoicePDFProps> = ({ invoice, companyName }) => {
  const date = new Date(invoice.invoice_date).toLocaleDateString();
  const subtotal = invoice.claim_amount;
  const deductions = invoice.deductions || 0;
  const gst = invoice.gst_amount || 0;
  const net = invoice.net_amount || (subtotal + gst - deductions);
  const items = invoice.items || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>Construction & Civil Engineering</Text>
            <Text style={styles.companyDetails}>GSTIN: 27ABCDE1234F1Z5</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE / RA BILL</Text>
            <View style={styles.invoiceMeta}>
              <Text style={styles.metaLabel}>Invoice No:</Text>
              <Text style={styles.metaValue}>{invoice.ra_bill_no || 'DRAFT'}</Text>
            </View>
            <View style={styles.invoiceMeta}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.billToSection}>
          <Text style={styles.sectionTitle}>Bill To / Project Details</Text>
          <Text style={styles.clientName}>{invoice.project_name || 'General Project'}</Text>
          <Text style={styles.companyDetails}>Project ID: {invoice.project_id}</Text>
        </View>

        {/* Dynamic Line Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNo}>No.</Text>
            <Text style={styles.colDesc}>BOQ Description</Text>
            <Text style={styles.colQty}>Quantity</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colAmount}>Amount (₹)</Text>
          </View>
          
          {items.length > 0 ? (
            items.map((item: any, index: number) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colDesc}>{item.boq_item}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colRate}>{item.rate.toLocaleString()}</Text>
                <Text style={styles.colAmount}>{item.amount.toLocaleString()}</Text>
              </View>
            ))
          ) : (
             <View style={styles.tableRow}>
                <Text style={styles.colNo}>1</Text>
                <Text style={styles.colDesc}>Running Account (RA) Bill Claim</Text>
                <Text style={styles.colQty}>1</Text>
                <Text style={styles.colRate}>{subtotal.toLocaleString()}</Text>
                <Text style={styles.colAmount}>{subtotal.toLocaleString()}</Text>
             </View>
          )}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Total Gross Claim (A)</Text>
              <Text>Rs {subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Less: Deductions/Advances (B)</Text>
              <Text>Rs {deductions.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Taxable Value (A - B)</Text>
              <Text>Rs {(subtotal - deductions).toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Add: GST (C)</Text>
              <Text>Rs {gst.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRowBold}>
              <Text>Grand Total (A - B + C)</Text>
              <Text>Rs {net.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.notes}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Terms & Conditions:</Text>
          <Text>{invoice.notes || 'Payment is due within 15 days of invoice date. Late payments are subject to 1.5% monthly interest.'}</Text>
        </View>
      </Page>
    </Document>
  );
};
