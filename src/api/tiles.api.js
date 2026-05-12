const BASE_URL = "http://localhost:8000"

export const getTileUrl = () => {
  return `${BASE_URL}/tiles/{z}/{x}/{y}.pbf`
}