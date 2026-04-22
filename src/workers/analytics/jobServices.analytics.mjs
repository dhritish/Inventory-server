import * as analyticsModels from '../../analytics/analyticsModels.mjs';
import PDFDocument from 'pdfkit';
import { getMonth } from '../../utils/helper.mjs';
import { getTransporter } from '../../config/mailer.mjs';

export const sendMail = async (month, pdfBuffer) => {
  const transporter = getTransporter();
  const monthLabel = month.toISOString();
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER,
    subject: `Inventory Report for ${monthLabel}`,
    attachments: [
      {
        filename: `report-${monthLabel}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };
  return await transporter.sendMail(mailOptions);
};

export const getReport = async () => {
  const date = new Date();
  const month = getMonth(date);
  const pdfChunks = [];
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  const pdfBuffer = new Promise((resolve, reject) => {
    doc.on('data', chunk => {
      pdfChunks.push(chunk);
    });
    doc.once('end', () => {
      resolve(Buffer.concat(pdfChunks));
    });
    doc.once('error', reject);
  });
  doc.text('Inventory Report', { align: 'center' });
  doc.moveDown();
  doc.font('Courier').fontSize(10);
  const columns = [
    { key: 'name', label: 'Name', x: 30, width: 170 },
    { key: 'price', label: 'Price', x: 210, width: 55 },
    { key: 'quantity', label: 'Qty', x: 275, width: 40 },
    { key: 'category', label: 'Category', x: 325, width: 140 },
    { key: 'order', label: 'Order', x: 475, width: 60 },
  ];
  const pageBottom = doc.page.height - doc.page.margins.bottom;

  const writeRow = (row, y, isHeader = false) => {
    const rowHeight =
      Math.max(
        ...columns.map(column =>
          doc.heightOfString(String(row[column.key] ?? ''), {
            width: column.width,
            align: isHeader ? 'left' : 'left',
          }),
        ),
      ) + 6;

    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    for (const column of columns) {
      doc.text(String(row[column.key] ?? ''), column.x, y, {
        width: column.width,
        align: 'left',
        lineBreak: false,
      });
    }

    doc
      .moveTo(doc.page.margins.left, y + rowHeight)
      .lineTo(doc.page.width - doc.page.margins.right, y + rowHeight)
      .stroke();

    return y + rowHeight + 4;
  };

  let y = doc.y;
  y = writeRow(
    {
      name: 'Name',
      price: 'Price',
      quantity: 'Qty',
      category: 'Category',
      order: 'Order',
    },
    y,
    true,
  );
  const cursor = analyticsModels.IndividualItemMonthlySales.aggregate([
    {
      $match: {
        month,
      },
    },
    {
      $lookup: {
        from: 'totalofitems',
        let: {
          localName: '$name',
          localPrice: '$price',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$name', '$$localName'] },
                  { $eq: ['$price', '$$localPrice'] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              quantity: 1,
            },
          },
        ],
        as: 'totalOfItem',
      },
    },
    {
      $unwind: {
        path: '$totalOfItem',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $set: {
        stock: '$totalOfItem.quantity',
      },
    },
    {
      $project: {
        totalOfItem: 0,
      },
    },
  ]).cursor();
  for await (const item of cursor) {
    const currentStock = item.stock ?? 0;
    const orderQuantity = Math.max(item.quantity * 1.5 - currentStock, 0);
    y = writeRow(
      {
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        order: orderQuantity,
      },
      y,
    );
  }
  doc.end();
  await sendMail(month, await pdfBuffer);
};
