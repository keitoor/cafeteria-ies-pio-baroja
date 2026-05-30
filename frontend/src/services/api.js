// ============================================================================
// Fachada única de la API
//   El resto de la app importa SIEMPRE desde aquí. La elección entre
//   mock y backend real se hace con la variable VITE_USE_MOCKS.
//   Esto significa que migrar a producción es solo cambiar una variable.
// ============================================================================

import {
  mockAuth,
  mockProductsApi,
  mockOrdersApi,
  mockPaymentsApi,
  mockStatsApi,
} from './mockApi';

import {
  realAuth,
  realProductsApi,
  realOrdersApi,
  realPaymentsApi,
  realStatsApi,
} from './realApi';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const api = USE_MOCKS
  ? {
      auth: mockAuth,
      products: mockProductsApi,
      orders: mockOrdersApi,
      payments: mockPaymentsApi,
      stats: mockStatsApi,
    }
  : {
      auth: realAuth,
      products: realProductsApi,
      orders: realOrdersApi,
      payments: realPaymentsApi,
      stats: realStatsApi,
    };

export const isMockMode = USE_MOCKS;
