import { queue } from '../queue.mjs';

export const digitalCheckout = (data, total, qrcode, user) => {
  const sold_date = new Date();
  for (const itemdata of data) {
    itemdata.qr_id = qrcode.id;
    itemdata.sold_date = sold_date;
    itemdata.user = user;
  }
  return queue.add(
    'digital',
    { data, total },
    {
      jobId: `digital-${sold_date}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
};

export const cashCheckout = (data, total, user) => {
  const sold_date = new Date();
  for (const itemdata of data) {
    itemdata.sold_date = sold_date;
    itemdata.user = user;
    itemdata.status = 'success';
  }
  return queue.add(
    'cash',
    { data, total },
    {
      jobId: `cash-${sold_date}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
};
