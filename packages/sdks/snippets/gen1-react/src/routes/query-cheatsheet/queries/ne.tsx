import { builder } from '@builder.io/react';
import type { GetContentOptions } from '@builder.io/sdk';

export const getProduct = (options: GetContentOptions) =>
  builder.get('contact-record', {
    query: { 'data.department': { $ne: 'Human Resources' } },
    ...options,
  });
