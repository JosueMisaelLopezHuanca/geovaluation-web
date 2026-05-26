import { apiPost } from "../lib/http"

export const loginAdmin = (credentials) =>
  apiPost("/api/v2/auth/login", {
    user: credentials.user,
    password: credentials.password,
  })
