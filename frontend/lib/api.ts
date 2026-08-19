const API_BASE_URL = "http://localhost:8080";

export async function checkBackendHealth(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.text();
}