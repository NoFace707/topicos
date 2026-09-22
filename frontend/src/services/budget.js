import { apiRequest } from "./api";

export const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

export const getDashboard = (month) =>
  apiRequest(`/api/budget/dashboard/${month ? `?month=${month}` : ""}`);

export const getAccounts = () => apiRequest("/api/budget/accounts/");
export const saveAccount = (account, id) =>
  apiRequest(`/api/budget/accounts/${id ? `${id}/` : ""}`, {
    method: id ? "PATCH" : "POST",
    body: account,
  });
export const setAccountArchived = (id, archived) =>
  apiRequest(`/api/budget/accounts/${id}/${archived ? "archive" : "reactivate"}/`, {
    method: "POST",
  });

export const getGroups = () => apiRequest("/api/budget/groups/");
export const saveGroup = (group, id) =>
  apiRequest(`/api/budget/groups/${id ? `${id}/` : ""}`, {
    method: id ? "PATCH" : "POST",
    body: group,
  });
export const setGroupArchived = (id, archived) =>
  apiRequest(`/api/budget/groups/${id}/${archived ? "archive" : "reactivate"}/`, {
    method: "POST",
  });

export const getCategories = () => apiRequest("/api/budget/categories/");
export const saveCategory = (category, id) =>
  apiRequest(`/api/budget/categories/${id ? `${id}/` : ""}`, {
    method: id ? "PATCH" : "POST",
    body: category,
  });
export const setCategoryArchived = (id, archived) =>
  apiRequest(`/api/budget/categories/${id}/${archived ? "archive" : "reactivate"}/`, {
    method: "POST",
  });

export const saveAllocation = (allocation) =>
  apiRequest("/api/budget/allocations/", { method: "POST", body: allocation });

export const getTransactions = (filters = {}) => {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== "" && value != null)
  ).toString();
  return apiRequest(`/api/budget/transactions/${query ? `?${query}` : ""}`);
};
export const saveTransaction = (transaction, id) =>
  apiRequest(`/api/budget/transactions/${id ? `${id}/` : ""}`, {
    method: id ? "PATCH" : "POST",
    body: transaction,
  });
export const deleteTransaction = (id) =>
  apiRequest(`/api/budget/transactions/${id}/`, { method: "DELETE" });

