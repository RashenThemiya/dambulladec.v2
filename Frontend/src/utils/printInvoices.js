import api from "./axiosInstance";

const waitForImagesToLoad = (container) => {
  const images = container.querySelectorAll("img");
  const promises = Array.from(images).map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve; // still resolve on error to prevent hang
        }
      })
  );
  return Promise.all(promises);
};

export const printInvoices = async (invoices) => {
  if (invoices.length === 0) {
    alert("Please select at least one invoice to print.");
    return;
  }

  try {
    await Promise.all(
      invoices.map((invoice) =>
        api.patch(`api/invoices/${invoice.invoice_id}/print`, { printed: true })
      )
    );
  } catch (err) {
    console.error("Failed to update invoices:", err);
  }

  const printableContent = invoices
    .map((invoice) => {
      const invoiceHTML = `
        <div style="padding: 0px; font-size: 11px; font-family:  'Noto Sans Sinhala', Arial, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 30px; background-color: #f0f0f0; border: 1px solid #000; padding: 5px; margin-bottom: 5px;">
                <img src="/images/Gov.jpg" alt="Logo" style="height: 60px;"/>
            <div style="text-align: center;">
              <h2 style="margin: 0; font-size: 15px;">දඹුල්ල විශේෂිත ආර්ථික මධ්‍යස්ථාන කළමනාකරණ භාරය</h2>
                    
          

              
              <h4 style="margin-top: 5px; font-size: 15px;">Monthly Rent Notice / මාසික බදු කුලිය අය කිරීමේ බිල්පත්‍රය</h4>
            </div>
              <img src="/images/logo.jpg" alt="Logo" style="height: 60px;" />
          </div>




      <div style="display: flex; justify-content: space-between; padding: 5px; background-color: #d0e7f9; font-size: 12px; font-family: Arial, sans-serif;">


  <div style=" text-transform: uppercase; letter-spacing: 0.5px;">
    <strong>Shop Detils</strong><br/>
    <span style="font-weight: normal; text-transform: none;">කඩ අංකය</span>: <span style="font-size: 15px;font-weight: bold;">${invoice.shop_id}
  </span>
  </span>
  </div>

  <div style=" text-transform: uppercase; letter-spacing: 0.5px;">
    <strong>Invoice Month</strong><br/>
    <span style="font-weight: normal; text-transform: none;">බිල්පත් මාසය</span>:<span style="font-size: 15px;font-weight: bold;"> ${new Date(
      invoice.month_year
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}
  </span></div>

  <div style=" text-transform: uppercase; letter-spacing: 0.5px;">
    <strong>Accounting Date</strong><br/>
    <span style="font-weight: normal; text-transform: none;">ගිණුම් කල දිනය</span>:<span style="font-size: 15px;font-weight: bold;"> ${new Date(
      invoice.createdAt
    ).toLocaleDateString()}
  </span></div>
  <div style=" text-transform: uppercase; letter-spacing: 0.5px;">
    <strong>Invoice No</strong><br/>
    <span style="font-weight: normal; text-transform: none;">බිල්පත් අංකය</span>: <span style="font-size: 15px;font-weight: bold;">${invoice.invoice_id}</span>
  </div>

</div>

      <div style="display: flex; justify-content: space-between; padding: 5px; background-color: #d0e7f9; font-size: 12px; font-family: Arial, sans-serif;">
  <div style=" text-transform: uppercase; letter-spacing: 0.5px;">
    <span style="font-weight: normal; text-transform: none;">බදුකරුගේ නම</span>: <span style="font-size: 15px;font-weight: bold;">${invoice.Shop.Tenant.name}</span>
  </div>
</div>

          <div style="display: flex; justify-content: space-between; margin-top: 10px; gap: 10px;">
            <div style="background-color: #f4d3a1; border: 1px solid #000; padding: 10px; width: 60%;">
              <h3 style="text-align: center; margin: 0 0 8px;">Statement of Account / ගිණුම් ප්‍රකාශය
</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td>Monthly Rent / මාසික කුලිය</td><td style="text-align: right;">Rs ${
                  invoice.rent_amount
                }</td></tr>
                <tr><td>Operation Fee / මෙහෙයුම් ගාස්තුව
</td><td style="text-align: right;">Rs ${invoice.operation_fee}</td></tr>
                <tr><td>VAT / එකතු කල අගය මත බද්ද
 </td><td style="text-align: right;">Rs ${invoice.vat_amount}</td></tr>
                <tr><td>Previous Balance / ශේෂය
</td><td style="text-align: right;">Rs ${invoice.previous_balance}</td></tr>
                <tr><td>Total Fines / සියලු දඩ</td><td style="text-align: right;">Rs ${
                  invoice.fines
                }</td></tr>
                <tr><td>Total Arrears / හිඟ බදු කුලිය
</td><td style="text-align: right;">Rs ${invoice.total_arrears}</td></tr>
                <tr style="border-top: 1px solid #000;"><td><strong>Total Amount / අය විය යුතු මුලු මුදල
</strong></td><td style="text-align: right;"><strong>Rs ${
        invoice.total_amount
      }</strong></td></tr>
              </table>
            </div>

<div style="display: flex; flex-direction: column; width: 20%;">
  <!-- Previous Month Payment Details -->
  <div style="background-color: #f4d3a1; border: 1px solid #000; padding: 5px;">
    <h4 style="text-align: center; margin-bottom: 8px;">පසුගිය මස ගෙවීම් විස්තර</h4>
    <div style="font-size: 10px;">
      <div>
        අවසන් වරට මුදල් ගෙවූ දිනය :
        <span>
          ${
            invoice.previous_payment_summary?.last_payment_date
              ? new Date(
                  invoice.previous_payment_summary.last_payment_date
                ).toLocaleDateString()
              : "N/A"
          }
        </span>
      </div>

      <div>
        පසුගිය මස ගෙවීමට තිබූ මුලු මුදල :
        <span>
          Rs ${
            invoice.previous_invoice_total_amount
              ? parseFloat(invoice.previous_invoice_total_amount).toFixed(2)
              : '0.00'
          }
        </span>
      </div>

      <div>
        පසුගිය මස ගෙවූ මුදල : <br/>
        <span>
          Rs ${parseFloat(invoice.previous_payment_summary?.total_paid || 0).toFixed(2)}
        </span>
      </div>
       <div>
        පසුගිය මසට දඩ : <br/>
        <span>
          Rs ${parseFloat(invoice.previous_fines || 0).toFixed(2)}
        </span>
      </div>
    </div>

    <div style="border-top: 1px solid black; margin: 8px 0;"></div>
  </div>

  <!-- VAT Info -->
  <div style="background-color: #e7f3d4; border: 1px solid #000; padding: 10px; font-size: 9px; margin-top: 10px;">
    <div style="height: 30px;">
<p style="margin: 0; text-align: center; font-size: 11px; word-wrap: break-word; white-space: normal;">
  VAT Registration No: 409238270/7000
</p>
    </div>
  </div>
</div>


      
            <div style="background-color: #e7f3d4; border: 1px solid #000; padding: 10px; width: 20%; font-size: 10px;">
          
              <h4 style="color: red; margin: 0 0 5px; border-bottom: 1px solid black;">
මෙම බිල්පතේ අයවිය යුතු මාසික කුලි මුදල් මෙම මස 15 වන දිනට පෙර ගෙවිය යුතුය. එසේ නොමැති වුවහොත් 30% ක දඩයක් අය කරනු ලැබේ.</h4>

              <div style="text-align: center;">
  <p style="margin: 0;">
    දඹුල්ල විශේෂිත ආර්ථික මධ්‍යස්ථාන<br/>
    කළමනාකරණ භාරය <br/>
    නමට ලංකා බැංකු ජංගම ගිණුම් අංක 2603285 දරණ ගිණුමට ඔබ විසින් මුදල් <br/>
    ගෙවීම් කළ යුතු අතර ඒ සඳහා මෙම බිල්පත අනිවාර්යයෙන්ම භාවිතා කල යුතුය
  </p>
</div>

            </div>
          </div>


     <div style="background-color: #fff3cd; border: 1px solid #000; padding-top: 2px; padding-right: 2px; padding-bottom: 1px; padding-left: 2px; margin-top: 4px;margin-bottom: 0px; font-size: 10px;overflow: visible;">
  <div style="display: flex; justify-content: space-between; align-items: stretch; text-align: left;">
    
    <!-- Section 1: Contacts -->
    <div style="flex: 1; padding-right: 10px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <p style="margin: 0;text-align: center;"><strong>විමසීම්
</strong></p>
        <p style="margin: 5px 0 0;">Manager<br/>Management Office<br/>Dedicated Economic Center<br/>Dambulla<br/>Tel: 066-2285181 / 066-2285448<br/>Email: dambulladec@gmail.com</p>
      </div>
    </div>


    <!-- Section 2: for market office -->
    <div style="flex: 1; padding-left: 10px; display: flex; flex-direction: column; justify-content: space-between;border-right: 1px solid #000;">
      <div>
        <p style="margin: 0;text-align: center;font-size: 13px;"><strong>For Trust Office Use</strong></p>
        
      </div>
      <div style="text-align: center; margin-top: auto;">
        <p style="margin: 0;">_________________<br/><span style="font-size: 11px;">Official Seal</span></p>
      </div>
    </div>
    <!-- Section 2: For Renter -->
    <div style="flex: 1.5; padding: 0 10px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <p style="margin: 0;text-align: center;"><strong>බදුකරුගේ ප්‍රයෝජනය සඳහා
</strong></p>
  <p style="margin: 5px 0;">
  බැංකුවට ගෙවූ මුදල: 
  <span style="display: inline-block; width: 165px; border: 1px solid #000; height: 20px; padding: 0 5px;">
    රු.
  </span>
</p>

      </div>
      <div style="text-align: center; margin-top: auto;">
        <p style="margin: 0;">_______________________<br/><span style="font-size: 11px;">බදුකරුගේ අත්සන
 </span></p>
      </div>
    </div>

 <!-- Section 3: Bank Cashier -->
    <div style="flex: 1.5; padding-left: 10px; display: flex; flex-direction: column; justify-content: space-between; ">
      <div>
        <p style="margin: 0;text-align: center;font-size: 13px;"><strong>Bank Use Only</strong></p>
          <p style="margin: 5px 0;font-size: 12px;">
  Amount Received: 
  <span style="display: inline-block; width: 165px; border: 1px solid #000; height: 20px; padding: 0 5px;">
    Rs.
  </span>
</p>
      </div>


      <div style="text-align: center; margin-top: auto;">
        <p style="margin: 0;">_______________________<br/><span style="font-size: 11px;">Signature of Bank Cashier</span></p>
      </div>
    </div>



   



   

  </div>
</div>






        </div>
      `;

      // return two copies stacked vertically
      return `
      <div class="invoice-copy">
        <div class="half-page">
  <div class="scale-content">
<p style="text-align: right; font-size: 12px; font-weight: bold; margin-top: 1px; margin-bottom: 1px; padding-top: 1px; padding-bottom: 1px;">
  Customer Copy
</p>

  ${invoiceHTML}
  </div>
</div>
        <hr style="margin: 10px 0; border: 1px dashed #aaa;" />
       <div class="half-page">
  <div class="scale-content">
        <p style="text-align: right; font-size: 12px; font-weight: bold; margin-top: 1px; margin-bottom: 1px; padding-top: 1px; padding-bottom: 1px;"> Office Copy </p>
    ${invoiceHTML}
  </div>
</div>
      </div>
      <div class="page-break"></div>
    `;
    })
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups for printing.");
    return;
  }

  printWindow.document.write(`
 <html>
<head>
  <title>Print Invoices</title>
    <link href="https://fonts.googleapis.com/css2?family=sans-serif&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Arial&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala&display=swap" rel="stylesheet">


 <style>
  @page {
    size: A4 portrait;
    margin: 4mm;
  }

  body {
    font-family: 'Noto Sans Sinhala',Arial, sans-serif;
    margin: 0;
    padding: 0;
  }

  .invoice-copy {
    page-break-inside: avoid;
    margin-bottom: 10mm;
  }

  .half-page {
    box-sizing: border-box;
    padding: 1mm;
    height: 130mm; /* fits two half-pages into 277mm usable area */
    overflow: hidden;
  }

  .scale-content {
    zoom: 0.88; /* zoom works better for print scaling than transform */
  }

  .page-break {
    page-break-after: always;
  }

  @media print {
    .page-break {
      display: block;
    }

    .invoice-copy {
      page-break-inside: avoid;
    }

    body {
      margin: 0;
      padding: 0;
    }
  }
</style>

</head>



            </head>
            <body>
                ${printableContent}
            </body>
        </html>
    `);

    printWindow.document.close();
    await waitForImagesToLoad(printWindow.document);
    printWindow.print();
    
};
