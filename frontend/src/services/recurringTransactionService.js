import api from '../config/axiosConfig';

const BASE = '/recurring-transactions';

export const createRecurring = async (payload) => {
  const resp = await api.post(BASE, payload);
  return resp.data.data;
};

export const listRecurring = async (params = {}) => {
  const resp = await api.get(BASE, { params });
  return resp.data.data;
};

export const getRecurring = async (id) => {
  const resp = await api.get(`${BASE}/${id}`);
  return resp.data.data;
};

export const updateRecurring = async (id, payload) => {
  const resp = await api.put(`${BASE}/${id}`, payload);
  return resp.data.data;
};

export const deleteRecurring = async (id) => {
  const resp = await api.delete(`${BASE}/${id}`);
  return resp.data.data;
};

export const runNow = async (id) => {
  const resp = await api.post(`${BASE}/${id}/run`);
  return resp.data.data;
};

export const processAll = async () => {
  const resp = await api.post(`${BASE}/process`);
  return resp.data.data;
};

export default {
  createRecurring,
  listRecurring,
  getRecurring,
  updateRecurring,
  deleteRecurring,
  runNow,
  processAll,
};