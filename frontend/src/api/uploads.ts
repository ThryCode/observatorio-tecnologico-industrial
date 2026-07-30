import client, { USE_MOCK } from './client';

const mockStore = new Map<string, File>();

let mockId = 0;

export async function uploadFile(file: File): Promise<{ filename: string; path: string; url: string; size: number }> {
  if (USE_MOCK) {
    mockId++;
    const ext = '.' + (file.name.split('.').pop() || 'bin');
    const filename = `mock-${mockId}${ext}`;
    mockStore.set(filename, file);
    return {
      filename,
      path: `uploads/${filename}`,
      url: URL.createObjectURL(file),
      size: file.size,
    };
  }
  const form = new FormData();
  form.append('file', file);
  const res = await client.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
