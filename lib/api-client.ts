// Utility functions untuk API calls
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "API Error")
  }

  return response.json()
}

export async function createSalesReport(data: {
  spgId: string
  tanggal: string
  produkId: string
  penjualanPack: string
  penjualanKarton: string
  hargaPack: string
  namaTokoTransaksi: string
  notes?: string
}) {
  return fetchAPI("/api/sales/create", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getSalesReports(spgId?: string) {
  const query = spgId ? `?spgId=${spgId}` : ""
  return fetchAPI(`/api/sales/list${query}`)
}

export async function getProducts() {
  return fetchAPI("/api/products/list")
}

export async function createProduct(data: { name: string; sku: string; category: string }) {
  return fetchAPI("/api/products/create", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getEmployees() {
  return fetchAPI("/api/employees/list")
}

export async function createEmployee(data: { name: string; email: string; role: string }) {
  return fetchAPI("/api/employees/create", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getAnalytics() {
  return fetchAPI("/api/analytics/summary")
}
