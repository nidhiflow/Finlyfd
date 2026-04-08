// API Configuration — reads from env for production (Render static site)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.nidhiflow.in";
const USE_MOCK_API = false; // Use real backend API

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  requireOTP?: boolean;
}

// Mock user database for demo purposes
const MOCK_USERS = [
  {
    id: "1",
    email: "demo@finly.app",
    password: "demo123",
    name: "Demo User",
    phone: "+1234567890",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    email: "test@test.com",
    password: "test123",
    name: "Test User",
    phone: "+9876543210",
    createdAt: new Date().toISOString(),
  },
];

// Mock API implementation
async function mockApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  console.log(`Mock API Call: ${endpoint}`, options.body ? JSON.parse(options.body as string) : {});

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Handle different endpoints
  if (endpoint === "/api/auth/login" && options.method === "POST") {
    const { email, password } = JSON.parse(options.body as string);
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      token: `mock-token-${Date.now()}`,
      user: userWithoutPassword,
    } as T;
  }

  if (endpoint === "/api/auth/signup" && options.method === "POST") {
    return { message: "Verification code sent to your email" } as T;
  }

  if (endpoint === "/api/auth/verify-otp" && options.method === "POST") {
    const { email, code } = JSON.parse(options.body as string);

    // Accept any 6-digit code for demo purposes
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Invalid OTP code");
    }

    const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
    const { password: _, ...userWithoutPassword } = user;

    return {
      token: `mock-token-${Date.now()}`,
      user: userWithoutPassword,
    } as T;
  }

  if (endpoint === "/api/auth/verify-login-otp" && options.method === "POST") {
    const { email, code } = JSON.parse(options.body as string);

    // Accept any 6-digit code for demo purposes
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Invalid OTP code");
    }

    const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
    const { password: _, ...userWithoutPassword } = user;

    return {
      token: `mock-token-${Date.now()}`,
      user: userWithoutPassword,
    } as T;
  }

  if (endpoint === "/api/auth/forgot-password" && options.method === "POST") {
    return { message: "Password reset code sent to your email" } as T;
  }

  if (endpoint === "/api/auth/reset-password" && options.method === "POST") {
    return { message: "Password successfully reset" } as T;
  }

  if (endpoint === "/api/auth/me" && options.method === "GET") {
    return MOCK_USERS[0] as T;
  }

  if (endpoint.includes("/api/transactions")) {
    if (options.method === "GET") {
      return [] as T;
    }
    if (options.method === "POST") {
      return { id: Date.now().toString(), ...JSON.parse(options.body as string) } as T;
    }
    if (options.method === "PUT" || options.method === "DELETE") {
      return { message: "Success" } as T;
    }
  }

  return {} as T;
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Use mock API if enabled
  if (USE_MOCK_API) {
    return mockApiCall<T>(endpoint, options);
  }

  const token = localStorage.getItem("authToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && !endpoint.includes("/auth/signup") && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/verify") && !endpoint.includes("/auth/forgot")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`API Call: ${endpoint}`, JSON.parse(options.body as string || "{}"));

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle both 200 and 201 as success
  if (!response.ok && response.status !== 201) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
    } catch (e) {
      console.error("Failed to parse error response");
    }
    throw new Error(errorMessage);
  }

  // Check if there's actually JSON content to parse
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return {} as T;
}

// Auth API
export const authAPI = {
  // Sign up - Step 1
  signup: async (data: { email: string; password: string; name: string; phone?: string }) => {
    return apiCall<{ message: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Verify OTP after signup - Step 2
  verifySignupOTP: async (data: { email: string; otp: string }) => {
    const response = await apiCall<AuthResponse>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        code: data.otp,
        type: "signup"
      }),
    });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    
    return response;
  },

  // Login - Step 1
  login: async (data: { email: string; password: string }) => {
    const response = await apiCall<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // If no OTP required, store token immediately
    if (response.token && response.user) {
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    }

    return response;
  },

  // Verify OTP for login (if requireOTP: true)
  verifyLoginOTP: async (data: { email: string; otp: string }) => {
    const response = await apiCall<AuthResponse>("/api/auth/verify-login-otp", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        code: data.otp
      }),
    });

    if (response.token) {
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    }

    return response;
  },

  // Forgot password - Step 1
  forgotPassword: async (data: { email: string }) => {
    return apiCall<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Verify OTP for password reset - Step 2
  verifyResetOTP: async (data: { email: string; otp: string; type: "reset" }) => {
    return apiCall<{ message: string; resetToken?: string }>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        code: data.otp,
        type: data.type
      }),
    });
  },

  // Reset password - Step 3
  resetPassword: async (data: { email: string; newPassword: string; resetToken?: string }) => {
    return apiCall<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get current user profile
  getProfile: async () => {
    return apiCall<User>("/api/auth/me", {
      method: "GET",
    });
  },

  // Update profile
  updateProfile: async (data: Partial<User>) => {
    return apiCall<User>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Update password
  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return apiCall<{ message: string }>("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete account
  deleteAccount: async () => {
    return apiCall<{ message: string }>("/api/auth/account", {
      method: "DELETE",
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};

// ─── TRANSACTIONS API ─────────────────────────────────────────────────────────
export const transactionsAPI = {
  getAll: async (params?: { month?: string; categoryId?: string; isRecurring?: string }) => {
    let url = "/api/transactions";
    const query = new URLSearchParams();
    if (params?.month) query.append("month", params.month);
    if (params?.categoryId) query.append("category_id", params.categoryId);
    if (params?.isRecurring) query.append("is_recurring", params.isRecurring);
    if (query.toString()) url += `?${query.toString()}`;
    
    return apiCall<any[]>(url, { method: "GET" });
  },
  getById: async (id: string) => apiCall<any>(`/api/transactions/${id}`, { method: "GET" }),
  create: async (data: any) => apiCall<any>("/api/transactions", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: string, data: any) => apiCall<any>(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: string) => apiCall<{ message: string }>(`/api/transactions/${id}`, { method: "DELETE" }),
  getRecurring: async () => apiCall<any[]>("/api/transactions/recurring", { method: "GET" }),
};

// ─── ACCOUNTS API ─────────────────────────────────────────────────────────────
export const accountsAPI = {
  getAll: async () => apiCall<any[]>("/api/accounts", { method: "GET" }),
  create: async (data: any) => apiCall<any>("/api/accounts", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: string, data: any) => apiCall<any>(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: string, force?: boolean) => apiCall<{ message: string }>(`/api/accounts/${id}${force ? '?force=true' : ''}`, { method: "DELETE" }),
};

// ─── BUDGETS API ──────────────────────────────────────────────────────────────
export const budgetsAPI = {
  get: async (month?: string) => {
    let url = "/api/budgets";
    if (month) url += `?month=${month}`;
    return apiCall<any>(url, { method: "GET" });
  },
  save: async (data: any) => apiCall<any>("/api/budgets", { method: "POST", body: JSON.stringify(data) }),
};

// ─── CATEGORIES API ───────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: async () => apiCall<any[]>("/api/categories", { method: "GET" }),
  create: async (data: any) => apiCall<any>("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: string, data: any) => apiCall<any>(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: string) => apiCall<{ message: string }>(`/api/categories/${id}`, { method: "DELETE" }),
};

// ─── SAVINGS GOALS API ────────────────────────────────────────────────────────
export const savingsGoalsAPI = {
  getAll: async (month?: string) => {
    let url = "/api/savings-goals";
    if (month) url += `?month=${month}`;
    return apiCall<any[]>(url, { method: "GET" });
  },
  create: async (data: any) => apiCall<any>("/api/savings-goals", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: string, data: any) => apiCall<any>(`/api/savings-goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  recordSavings: async (id: string, amount: number) => apiCall<any>(`/api/savings-goals/${id}/record`, { method: "POST", body: JSON.stringify({ amount }) }),
  delete: async (id: string) => apiCall<{ message: string }>(`/api/savings-goals/${id}`, { method: "DELETE" }),
};

// ─── STATS API ────────────────────────────────────────────────────────────────
export const statsAPI = {
  getSummary: async (month?: string) => {
    let url = "/api/stats/summary";
    if (month) url += `?month=${month}`;
    return apiCall<any>(url, { method: "GET" });
  },
  getFinlyScore: async (month?: string) => {
    let url = "/api/stats/finly-score";
    if (month) url += `?month=${month}`;
    return apiCall<any>(url, { method: "GET" });
  },
  getDailyExpenses: async (month: string) => apiCall<any[]>(`/api/stats/daily-expenses?month=${month}`, { method: "GET" }),
  getCategoryBreakdown: async (month: string) => apiCall<any[]>(`/api/stats/category-breakdown?month=${month}`, { method: "GET" }),
};

// ─── SETTINGS API ─────────────────────────────────────────────────────────────
export const settingsAPI = {
  getAll: async () => apiCall<any>("/api/settings", { method: "GET" }),
  update: async (data: any) => apiCall<any>("/api/settings", { method: "POST", body: JSON.stringify(data) }),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: async (prompt: string) => apiCall<any>("/api/ai/chat", { method: "POST", body: JSON.stringify({ prompt }) }),
};

// ─── BOOKMARKS API ────────────────────────────────────────────────────────────
export const bookmarksAPI = {
  getAll: async () => apiCall<any[]>("/api/bookmarks", { method: "GET" }),
  create: async (transactionId: string) => apiCall<any>("/api/bookmarks", { method: "POST", body: JSON.stringify({ transaction_id: transactionId }) }),
  delete: async (transactionId: string) => apiCall<{ message: string }>(`/api/bookmarks/${transactionId}`, { method: "DELETE" }),
};

// Export the base URL for other uses
export { API_BASE_URL };