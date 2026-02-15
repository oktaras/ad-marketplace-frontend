import axios from 'axios';
import { env } from '@/app/config/env';
import { setupInterceptors } from '@/shared/api/interceptors';

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupInterceptors(http);
