import * as analyticsJobServices from './jobServices.analytics.mjs';

export const report = async () => {
  await analyticsJobServices.getReport();
};
