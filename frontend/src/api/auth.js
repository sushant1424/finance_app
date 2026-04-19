import { api } from "./axios";

export const authApi = {
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  login: async (data) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};
