export class ThingiverseApi {
  private readonly headers: {
    Authorization: string;
    [key: string]: string;
  };

  constructor(token: string) {
    this.headers = { Authorization: "Bearer " + token };
  }

  async getThingFiles(thingId: string | number, accessPath: string): Promise<unknown[]> {
    const res = await fetch(`https://api.thingiverse.com/things/${thingId}${accessPath}`, {
      headers: this.headers,
      method: "GET",
    });
    return res.json();
  }

  async deleteThingFile(thingId: string | number, accessPath: string, fileId: number): Promise<unknown> {
    const res = await fetch(`https://api.thingiverse.com/things/${thingId}${accessPath}/${fileId}`, {
      headers: this.headers,
      method: "DELETE",
    });
    return res.json();
  }

  async createFileUpload(thingId: string | number, filename: string): Promise<Record<string, unknown>> {
    const res = await fetch(`https://api.thingiverse.com/things/${thingId}/files`, {
      headers: this.headers,
      body: JSON.stringify({ filename }),
      method: "POST",
    });
    return res.json();
  }

  async uploadFileStorage(formData: FormData): Promise<void> {
    await fetch("https://www.thingiverse.com/upload_file_storage", {
      body: formData,
      redirect: "manual",
      method: "POST",
    });
  }

  async finalizeUpload(redirectUrl: string): Promise<unknown> {
    const res = await fetch(redirectUrl, { ...{ headers: this.headers }, method: "POST" });
    return res.json();
  }

  async getThingImages(thingId: string | number): Promise<unknown[]> {
    const res = await fetch(`https://api.thingiverse.com/things/${thingId}/images`, {
      headers: this.headers,
      method: "GET",
    });
    return res.json();
  }

  async patchImageRank(thingId: string | number, imageId: number, rank: number | string): Promise<void> {
    await fetch(`https://api.thingiverse.com/things/${thingId}/images/${imageId}`, {
      headers: this.headers,
      body: JSON.stringify({ rank }),
      method: "PATCH",
    });
  }

  async publishThing(thingId: string | number): Promise<void> {
    await fetch(`https://api.thingiverse.com/things/${thingId}/publish`, {
      headers: this.headers,
      method: "POST",
    });
  }

  async getThing(thingId: string | number): Promise<Record<string, unknown>> {
    const res = await fetch(`https://api.thingiverse.com/things/${thingId}`, {
      headers: this.headers,
      method: "GET",
    });
    return res.json();
  }

  async createThing(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch("https://api.thingiverse.com/things/", {
      headers: this.headers,
      body: JSON.stringify(params),
      method: "POST",
    });
    return res.json();
  }

  async patchThing(thingId: string | number, params: Record<string, unknown>): Promise<void> {
    await fetch(`https://api.thingiverse.com/things/${thingId}/`, {
      headers: this.headers,
      body: JSON.stringify(params),
      method: "PATCH",
    });
  }

  async getThingAfterPatch(thingId: string | number): Promise<Record<string, unknown>> {
    const res = await fetch(`https://api.thingiverse.com/things/${thingId}/`, {
      headers: this.headers,
      method: "GET",
    });
    return res.json();
  }
}
