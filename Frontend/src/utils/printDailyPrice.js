const waitForImagesToLoad = (container) => {
  const images = container.querySelectorAll("img");
  const promises = Array.from(images).map(img =>
    new Promise(resolve => {
      if (img.complete) resolve();
      else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    })
  );
  return Promise.all(promises);
};

export const printDailyPrices = async ({ prices, date, ui, productNames, types }) => {
  if (!prices || prices.length === 0) {
    alert(ui.noPrices);
    return;
  }

  // Group prices by product type (or uncategorized)
  const grouped = prices.reduce((acc, item) => {
    const type = item.product?.type || ui.uncategorized;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const capitalize = str => str ? str.charAt(0).toLocaleUpperCase() + str.slice(1) : "";

  // Convert grouped object into array of groups with header and items
  const groups = Object.entries(grouped).map(([type, items]) => ({
    header: capitalize(types?.[type] || type),
    items
  }));

  // Calculate total number of items (excluding headers)
  let totalItemsCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  // Pad groups with empty items to reach 120 total items (excluding headers)
  const itemsToAdd = 120 - totalItemsCount;
  if (itemsToAdd > 0) {
    if (groups.length === 0) {
      groups.push({ header: ui.uncategorized, items: Array(itemsToAdd).fill(null) });
    } else {
      groups[groups.length - 1].items.push(...Array(itemsToAdd).fill(null));
    }
    totalItemsCount = 120;
  }

  // Split groups into two columns so that each column has ~60 items (excluding headers)
  const rowsPerCol = 60;
  const col1 = [];
  const col2 = [];

  let currentCount = 0;
  for (const group of groups) {
    if (currentCount + group.items.length <= rowsPerCol) {
      col1.push({ isHeader: true, label: group.header });
      group.items.forEach(item => col1.push({ isHeader: false, item }));
      currentCount += group.items.length;
    } else {
      col2.push({ isHeader: true, label: group.header });
      group.items.forEach(item => col2.push({ isHeader: false, item }));
    }
  }

  // Pad columns to exactly 60 items (excluding headers)
  const padColumn = (col) => {
    let count = col.filter(e => !e.isHeader).length;
    while (count < rowsPerCol) {
      col.push({ isHeader: false, item: null });
      count++;
    }
  };
  padColumn(col1);
  padColumn(col2);

  // Calculate cumulative counts for numbering items per column
  const cumulativeCounts = [0, col1.filter(e => !e.isHeader && e.item).length];

  // Build table header HTML for two columns
  const headerRow = Array(2).fill(`
    <th style="border:1px solid #000; padding:2px; font-size:9.25px; font-weight:bold; width:5%;">${ui.tableHeaders.number}</th>
    <th style="border:1px solid #000; padding:2px; font-size:9.25px; font-weight:bold;">${ui.tableHeaders.item}</th>
    <th style="border:1px solid #000; padding:2px; font-size:9.25px; font-weight:bold; width:13%;">${ui.tableHeaders.minPrice}</th>
    <th style="border:1px solid #000; padding:2px; font-size:9.25px; font-weight:bold; width:13%;">${ui.tableHeaders.maxPrice}</th>
  `).join(`<th style="width:8px; border:none;"></th>`);

  // Build table rows for each row index (0 to 59)
  let tableRows = "";
  for (let i = 0; i < rowsPerCol; i++) {
    tableRows += "<tr>";
    [col1, col2].forEach((column, colIndex) => {
      const entry = column[i];
      if (!entry) {
        tableRows += `<td colspan="4" style="border:none;"></td>`;
      } else if (entry.isHeader) {
        tableRows += `
          <td colspan="4" style="border:1px solid #000; background:#eee; font-size:8.25px; font-weight:bold; padding:2px; text-align:left;">
            ${entry.label}
          </td>
        `;
      } else {
        const item = entry.item;

        // Calculate index: count only valid items (non-header and non-null) up to this row
        const validItemsUpToRow = column.slice(0, i + 1).filter(e => !e.isHeader && e.item).length;
        const index = cumulativeCounts[colIndex] + validItemsUpToRow;

        const name = item?.product?.name ? (productNames?.[item.product.name] || item.product.name) : "";
        const min = item?.min_price ? `Rs. ${Number(item.min_price).toFixed(2)}` : "";
        const max = item?.max_price ? `Rs. ${Number(item.max_price).toFixed(2)}` : "";

        tableRows += `
          <td style="border:1px solid #000; padding:2px; font-size:8.25px; font-weight:bold;">${item ? index : ""}</td>
          <td style="border:1px solid #000; padding:2px; font-size:8.25px; font-weight:bold;">${name}</td>
          <td style="border:1px solid #000; padding:2px; font-size:8.25px; font-weight:bold; text-align:right;">${min}</td>
          <td style="border:1px solid #000; padding:2px; font-size:8.25px; font-weight:bold; text-align:right;">${max}</td>
        `;
      }
      if (colIndex === 0) {
        tableRows += `<td style="width:8px; border:none;"></td>`;
      }
    });
    tableRows += "</tr>";
  }

  // Compose full table HTML
  const tableHtml = `
    <table style="width:100%; border-collapse:collapse; margin:0; page-break-inside: avoid;">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  // Compose full content HTML
  const content = `
    <div style="font-family: 'Iskoola Pota', 'Noto Sans Sinhala', Arial, sans-serif;">
      <!-- HEADER -->
      <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:4px;">
        <img src="/images/Gov.jpg" alt="Left Logo" style="height:70px;">
        <div style="flex:1; text-align:center;">
          <div style="font-size:16.25px; font-weight:bold;">${ui.title}</div>
          <div style="font-size:10.25px;">${ui.center}</div>
        </div>
        <img src="/images/logo.jpg" alt="Right Logo" style="height:70px;">
      </div>

      <!-- CONTACT ROW -->
      <div style="display:flex; justify-content:space-between; font-size:9.25px; margin-bottom:4px;">
        <div>${ui.tel}</div>
        <div>${ui.dateLabel}: <strong>${date}</strong></div>
        <div>${ui.emailLabel}: dambulladec@gmail.com</div>
      </div>

      <!-- TABLE -->
      ${tableHtml}

      <!-- FOOTER -->
      <div style="margin-top:4px; font-size:8.25px; background:#fff3cd; border:1px solid #000; padding:4px;">
        <strong>${ui.inquiry}</strong> ${ui.manager}<br/>
        ${ui.contact}
      </div>
    </div>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(ui.popupBlocked);
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${ui.title}</title>
        <style>
          @page { size: A4 portrait; margin: 5mm; }
          body { margin: 0; padding: 0; }
          table, th, td { border-collapse: collapse; }
          body, td, th {
            font-family: 'Iskoola Pota', 'Noto Sans Sinhala', Arial, sans-serif !important;
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&display=swap" rel="stylesheet">
      </head>
      <body>${content}</body>
    </html>
  `);

  printWindow.document.close();
  await waitForImagesToLoad(printWindow.document.body);
  printWindow.focus();
  printWindow.print();
};
