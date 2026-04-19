import { api } from "./axios";

export const accountsApi = {
  getAccounts: async () => (await api.get("/accounts")).data,
  getAccount: async (id) => (await api.get(`/accounts/${id}`)).data,
  createAccount: async (data) => (await api.post("/accounts", data)).data,
  updateAccount: async (id, data) => (await api.put(`/accounts/${id}`, data)).data,
  deleteAccount: async (id) => (await api.delete(`/accounts/${id}`)).data,
};

export const transactionsApi = {
  getTransactions: async (params) => (await api.get("/transactions", { params })).data,
  createTransaction: async (data) => (await api.post("/transactions", data)).data,
  updateTransaction: async (id, data) => (await api.put(`/transactions/${id}`, data)).data,
  deleteTransaction: async (id) => (await api.delete(`/transactions/${id}`)).data,
  exportCsv: async () => (await api.get("/transactions/export", { responseType: "blob" })).data,
};

export const categoriesApi = {
  getCategories: async () => (await api.get("/categories")).data,
  createCategory: async (data) => (await api.post("/categories", data)).data,
  updateCategory: async (id, data) => (await api.put(`/categories/${id}`, data)).data,
  deleteCategory: async (id) => (await api.delete(`/categories/${id}`)).data,
};

export const budgetsApi = {
  getBudgets: async (params) => (await api.get("/budgets", { params })).data,
  createBudget: async (data) => (await api.post("/budgets", data)).data,
  updateBudget: async (id, data) => (await api.put(`/budgets/${id}`, data)).data,
  deleteBudget: async (id) => (await api.delete(`/budgets/${id}`)).data,
};

export const goalsApi = {
  getGoals: async () => (await api.get("/goals")).data,
  createGoal: async (data) => (await api.post("/goals", data)).data,
  updateGoal: async (id, data) => (await api.put(`/goals/${id}`, data)).data,
  deleteGoal: async (id) => (await api.delete(`/goals/${id}`)).data,
};

export const insightsApi = {
  getAnomalies: async () => (await api.get("/insights/anomalies")).data,
  getForecast: async () => (await api.get("/insights/forecast")).data,
  refreshForecast: async () => (await api.post("/insights/forecast/refresh")).data,
};

export const reportsApi = {
  getSummary: async (params) => (await api.get("/reports/summary", { params })).data,
};

export const usersApi = {
  getProfile: async () => (await api.get("/users/me")).data,
  updateProfile: async (data) => (await api.put("/users/me", data)).data,
  changePassword: async (data) => (await api.put("/users/me/password", data)).data,
  deleteProfile: async () => (await api.delete("/users/me")).data,
};
