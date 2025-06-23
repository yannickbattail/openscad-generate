import fetch from "node-fetch";

/**
 * Thingiverse API client
 */
export class Thingiverse {
  private baseUrl = "https://api.thingiverse.com";

  constructor(private config: { client_id: string; client_secret: string; redirect_uri: string; token: string }) {}

  async get_thing(thingId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/things/${thingId}`, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get thing: ${response.statusText}`);
    }

    return response.json();
  }

  async get_thing_file(thingId: string, fileId: string | null): Promise<any> {
    const url = fileId
      ? `${this.baseUrl}/things/${thingId}/files/${fileId}`
      : `${this.baseUrl}/things/${thingId}/files`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get thing file: ${response.statusText}`);
    }

    return response.json();
  }

  async delete_thing_file(thingId: string, fileId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/things/${thingId}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete thing file: ${response.statusText}`);
    }

    return response.json();
  }

  async upload_thing_file(thingId: string, data: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/things/${thingId}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload thing file: ${response.statusText}`);
    }

    return response.json();
  }

  async finalize_file(fileId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}/finalize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to finalize file: ${response.statusText}`);
    }

    return response.json();
  }
}
