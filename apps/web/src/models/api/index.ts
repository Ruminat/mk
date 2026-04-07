import { getEnvironmentVariables } from "../environment/utils";

const { apiHost } = getEnvironmentVariables();

export async function getRequest(path: string, params?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiHost}${path}`, params);

  return handleResponse(response);
}

export async function postRequest(path: string, data?: unknown, params?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiHost}${path}`, {
    method: "POST",
    // credentials: "include",
    body: data ? JSON.stringify(data) : undefined,

    ...params,

    headers: {
      "Content-Type": "application/json",
      ...params?.headers,
    },
  });

  return handleResponse(response);
}

async function handleResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    const error = {
      message: `HTTP error! status: ${response.status}`,
      status: response.status,
      data: errorData,
    };

    throw error;
  }

  try {
    const json = await response.json();

    return json;
  } catch (error) {
    return response.text();
  }
}
