import { getTransporter } from '../../../src/config/mailer.mjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMail } from '../../../src/workers/analytics/jobServices.analytics.mjs';

vi.mock('../../../src/config/mailer.mjs', () => ({
  getTransporter: vi.fn().mockReturnValue({
    sendMail: vi.fn(),
  }),
}));

// vi.mock('../../../src/analytics/analyticsModels.mjs', () => {
//   return {
//     analyticsModels: {
//       IndividualItemMonthlySales: {
//         aggregate: vi.fn().mockReturnValue({
//           cursor: vi.fn().mockReturnValue(
//             (async function* () {
//               yield {
//                 name: 'chips',
//                 price: 10,
//                 quantity: 8,
//                 category: 'snacks',
//               };
//             })(),
//           ),
//         }),
//       },
//     },
//   };
// });

describe('jobServices analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMTP_USER = 'xyz@gmail.com';
  });

  it('send mail', async () => {
    const month = new Date();
    await sendMail(month, Buffer.from('test'));
    expect(getTransporter).toHaveBeenCalled();
    expect(getTransporter().sendMail).toHaveBeenCalledWith({
      from: 'xyz@gmail.com',
      to: 'xyz@gmail.com',
      subject: `Inventory Report for ${month.toISOString()}`,
      attachments: [
        {
          filename: `report-${month.toISOString()}.pdf`,
          content: Buffer.from('test'),
          contentType: 'application/pdf',
        },
      ],
    });
  });
});
