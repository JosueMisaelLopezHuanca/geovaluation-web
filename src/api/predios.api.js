const BASE_URL = "http://localhost:8000"

export const getPredios = async (bbox) => {
  const response = await fetch(
    `${BASE_URL}/predios/bbox?bbox=${bbox}`
  )
  return await response.json()
}