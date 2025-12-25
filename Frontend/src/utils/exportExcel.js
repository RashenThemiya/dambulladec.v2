import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const setHeaderStyle = (worksheet) => {
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4CAF50' }, // Green background
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
};

export const exportShopSummaryExcel = async (shop) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Shop Summary");

    worksheet.columns = [
        { header: "Field", key: "field", width: 30 },
        { header: "Value", key: "value", width: 30 },
    ];

    setHeaderStyle(worksheet);

    const shopSummary = [
        { field: "Shop ID", value: shop.shop_id },
        { field: "Shop Name", value: shop.shop_name },
        { field: "Location", value: shop.location },
        { field: "Rent Amount", value: shop.rent_amount },
        { field: "VAT Rate (%)", value: shop.vat_rate },
        { field: "Operation Fee", value: shop.operation_fee },
        { field: "Balance (LKR)", value: shop.ShopBalance?.balance_amount || "0.00" },
    ];

    shopSummary.forEach(row => {
        worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ShopSummary_${shop.shop_name}.xlsx`);
};

export const exportPaymentsExcel = async (payments, shopName) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    worksheet.columns = [
        { header: "Payment ID", key: "payment_id", width: 20 },
        { header: "Amount Paid", key: "amount_paid", width: 20 },
        { header: "Payment Date", key: "payment_date", width: 20 },
        { header: "Payment Method", key: "payment_method", width: 20 },
    ];

    setHeaderStyle(worksheet);

    payments.forEach(payment => {
        worksheet.addRow({
            payment_id: payment.payment_id,
            amount_paid: payment.amount_paid,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method,
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Payments_${shopName}.xlsx`);
};


export const exportInvoicesExcel = async (invoices, shopName, payments) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    worksheet.columns = [
        { header: "Invoice ID", key: "invoice_id", width: 20 },
        { header: "Month/Year", key: "month_year", width: 20 },
        { header: "Previous Balance (LKR)", key: "previous_balance", width: 20 },
        { header: "Fines (LKR)", key: "fines", width: 20 },
        { header: "Previous Fines (LKR)", key: "previous_fines", width: 20 },
        { header: "Rent Amount (LKR)", key: "rent_amount", width: 20 },
        { header: "Operation Fee (LKR)", key: "operation_fee", width: 20 },
        { header: "VAT Amount (LKR)", key: "vat_amount", width: 20 },
        { header: "Total Amount (LKR)", key: "total_amount", width: 20 },
        { header: "Total Paid (LKR)", key: "total_paid", width: 20 },
        { header: "Remaining Amount (LKR)", key: "remaining_amount", width: 20 },
        { header: "Extra Payment (LKR)", key: "extra_payment", width: 20 },
        { header: "Status", key: "status", width: 20 },
    ];

    setHeaderStyle(worksheet);

    // Sort invoices descending by createdAt (newest first), same as frontend
    const sortedInvoices = [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedInvoices.forEach((invoice, index) => {
        const previousInvoice = index > 0 ? sortedInvoices[index - 1] : null;

        // Invoice period
        const invoiceCreated = new Date(invoice.createdAt);
        const nextInvoiceCreated = previousInvoice ? new Date(previousInvoice.createdAt) : null;

        const startOfPeriod = invoiceCreated;
        const endOfPeriod = nextInvoiceCreated || new Date();

        // Payments within invoice period
        const invoicePayments = payments?.filter(payment => {
            const paymentDate = new Date(payment.payment_date);
            return paymentDate >= startOfPeriod && paymentDate < endOfPeriod;
        }) || [];

        const totalPaid = invoicePayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);

        const invoiceTotalAmount = parseFloat(invoice.total_amount) || 0;

        // Fine paid from fines array
        const finePaid = invoice.Fines?.reduce(
            (sum, fine) => sum + parseFloat(fine.paid_amount || 0),
            0
        ) || 0;

        const overpaidAmount = totalPaid - invoiceTotalAmount;

        const extraPayment = Math.max(0, overpaidAmount - finePaid);

        const remainingAmount = extraPayment > 0 ? 0 : invoiceTotalAmount - totalPaid;

        worksheet.addRow({
            invoice_id: invoice.invoice_id,
            month_year: new Date(invoice.month_year).toLocaleDateString(),
            previous_balance: `LKR ${invoice.previous_balance || 0}`,
            fines: `LKR ${invoice.fines || 0}`,
            previous_fines: `LKR ${invoice.previous_fines || 0}`,
            rent_amount: `LKR ${invoice.rent_amount || 0}`,
            operation_fee: `LKR ${invoice.operation_fee || 0}`,
            vat_amount: `LKR ${invoice.vat_amount || 0}`,
            total_amount: `LKR ${invoice.total_amount || 0}`,
            total_paid: `LKR ${totalPaid.toFixed(2)}`,
            remaining_amount: `LKR ${remainingAmount.toFixed(2)}`,
            extra_payment: extraPayment > 0 ? `LKR ${extraPayment.toFixed(2)}` : "-",
            status: invoice.status,
        });
    });
    const buffer = await workbook.xlsx.writeBuffer();
saveAs(new Blob([buffer]), `Invoices_${shopName}.xlsx`);

};
