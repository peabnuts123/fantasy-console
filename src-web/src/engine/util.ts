export async function get_resource(url: string): Promise<Uint8Array> {
  try {
    const result = await fetch(url);
    if (result.ok) {
      const arrayBuffer = await result.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } else {
      throw new Error('Failed to fetch: ' + result.statusText);
    }
  } catch (e) {
    throw new Error('Error while fetching: ' + e);
  }
}