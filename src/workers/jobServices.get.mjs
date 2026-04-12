import * as checkoutModels from '../checkout/checkoutModels.mjs';
import * as inventoryModels from '../inventory/inventoryModels.mjs';
import * as analyticsModels from '../analytics/analyticsModels.mjs';
import * as authModels from '../auth/authModels.mjs';
import { pipeline } from '@xenova/transformers';
import { getFirebaseAdmin } from '../config/firebase.mjs';
import PDFDocument from 'pdfkit';
import { getMonth } from '../utils/helper.mjs';
import { getTransporter } from '../config/mailer.mjs';

export const getUserFromIndividualItemTransaction = qr_id => {
  return checkoutModels.IndividualItemTransactions.findOne({ qr_id })
    .select('user -_id')
    .lean();
};

export const getDeviceToken = user => {
  return authModels.DeviceToken.find({ user })
    .select('devicetoken -_id')
    .lean();
};

export const sendNotification = async (qr_id, status, total) => {
  const admin = getFirebaseAdmin();

  const user = await getUserFromIndividualItemTransaction(qr_id);
  if (!user) {
    return;
  }
  const res_devicetokens = await getDeviceToken(user.user);
  if (res_devicetokens.length === 0) {
    return;
  }
  const devicetokens = res_devicetokens.map(
    devicetoken => devicetoken.devicetoken,
  );
  const message = {
    tokens: devicetokens,
    notification: {
      title: `Payment ${status}`,
      body: String(total),
    },
    data: {
      title: `Payment ${status}`,
      body: String(total),
    },
  };
  return await admin.messaging().sendEachForMulticast(message);
};

export const getIndividualItemTransaction = (qr_id, session) => {
  return checkoutModels.IndividualItemTransactions.find({ qr_id })
    .session(session)
    .select('name price quantity expire sold_date category -_id')
    .lean();
};

export const getEmbedding = async name => {
  const embedder = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
  );
  return await embedder(name, {
    pooling: 'mean',
    normalize: true,
  });
};

export const getCategoryString = async () => {
  const categories = await analyticsModels.Categories.find()
    .select('category -_id')
    .lean();
  const arr = categories.map(category => category.category);
  return arr.join(', ');
};

export const getCategoryEmbeddingOfItem = (data, session) => {
  return inventoryModels.TotalOfItems.findOne({
    name: data.name,
  })
    .session(session)
    .select('category embedding -_id')
    .lean();
};

export const sendMail = async (month, pdfBuffer) => {
  const transporter = getTransporter();
  const monthLabel = month.toISOString();
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'wedphoto5dec@gmail.com',
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
  const cursor = analyticsModels.IndividualItemMonthlySales.find({
    month,
  }).cursor();
  for await (const item of cursor) {
    const res = await inventoryModels.TotalOfItems.findOne({
      name: item.name,
      price: item.price,
    })
      .select('quantity -_id')
      .lean();
    const currentStock = res?.quantity ?? 0;
    const orderQuantity = item.quantity * 1.5 - currentStock;
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
