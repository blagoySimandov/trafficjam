// Try alternative Overpass API instances if one is overloaded
const OVERPASS_API_INSTANCES = [
  "https://lz4.overpass-api.de/api/interpreter", // Alternative server, same provider
  "https://overpass.kumi.systems/api/interpreter", // Kumi Systems mirror
  "https://overpass-api.de/api/interpreter", // Original (fallback)
];

let currentInstanceIndex = 0;
const OVERPASS_API_URL = OVERPASS_API_INSTANCES[currentInstanceIndex];
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchFromOverpass(query, retryCount = 0, instanceIndex = 0) {
  const apiUrl = OVERPASS_API_INSTANCES[instanceIndex];
  console.log(`Fetching from Overpass API: ${apiUrl} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    console.log('Overpass API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();

      // If server is busy (504), try different strategies
      if (response.status === 504) {
        // First, try a different API instance
        if (instanceIndex < OVERPASS_API_INSTANCES.length - 1) {
          console.log(`Server busy, trying different API instance...`);
          return fetchFromOverpass(query, 0, instanceIndex + 1);
        }

        // If all instances tried, retry with backoff
        if (retryCount < MAX_RETRIES - 1) {
          console.log(`All instances busy, retrying in ${RETRY_DELAY * (retryCount + 1)}ms...`);
          await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
          return fetchFromOverpass(query, retryCount + 1, 0); // Start from first instance again
        }
      }

      console.error('Overpass API error:', errorText);
      throw new Error(`Overpass API error: ${response.status} - All servers are too busy. Please try again in a moment.`);
    }

    const data = await response.json();
    console.log('Received OSM data:', data);
    return data;
  } catch (error) {
    // Network error - try next instance or retry
    if (error.message.includes('fetch') || error.name === 'TypeError') {
      // Try next instance first
      if (instanceIndex < OVERPASS_API_INSTANCES.length - 1) {
        console.log(`Network error, trying different API instance...`);
        return fetchFromOverpass(query, retryCount, instanceIndex + 1);
      }

      // If all instances tried, retry with backoff
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Network error, retrying in ${RETRY_DELAY * (retryCount + 1)}ms...`);
        await sleep(RETRY_DELAY * (retryCount + 1));
        return fetchFromOverpass(query, retryCount + 1, 0);
      }
    }
    throw error;
  }
}
