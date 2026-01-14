import db from '../db/database';

/**
 * Service to manage driver profile images
 * Generates image URLs based on F1 official media CDN patterns
 */

// F1 Media CDN base URLs
const F1_DRIVER_IMAGE_BASE = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers';
const F1_FALLBACK_IMAGE = 'https://via.placeholder.com/150/E10600/FFFFFF?text=F1';

/**
 * Generate driver image URL using F1 Media CDN pattern
 * Pattern: https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/{YEAR_LETTER}/{CODE+NUMBER}.png.transform/1col/image.png
 *
 * Example: Max Verstappen (#33, VER)
 * -> https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01.png.transform/1col/image.png
 */
function generateDriverImageUrl(driverName: string, code: string, number: string): string {
  try {
    // Get first letter of last name
    const nameParts = driverName.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstLetter = lastName.charAt(0).toUpperCase();

    // Create driver code: First 3 letters of first name + first 3 letters of last name
    const firstName = nameParts[0];
    const driverCode = (firstName.slice(0, 3) + lastName.slice(0, 3)).toUpperCase();

    // Construct image URL
    const imageId = `${driverCode}01`;
    return `${F1_DRIVER_IMAGE_BASE}/${firstLetter}/${imageId}.png.transform/1col/image.png`;
  } catch (error) {
    console.error(`Error generating image URL for ${driverName}:`, error);
    return F1_FALLBACK_IMAGE;
  }
}

/**
 * Generate driver image URL using multiple fallback patterns
 * Tries several known working patterns for F1 driver images
 */
function generatePortraitUrl(driverId: string, year: number = 2026): string {
  // Manual mapping for known 2024-2026 drivers with working image URLs
  const knownDriverImages: Record<string, string> = {
    'max_verstappen': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01.png.transform/1col/image.png',
    'lewis_hamilton': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01.png.transform/1col/image.png',
    'charles_leclerc': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01.png.transform/1col/image.png',
    'lando_norris': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01.png.transform/1col/image.png',
    'oscar_piastri': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01.png.transform/1col/image.png',
    'george_russell': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01.png.transform/1col/image.png',
    'carlos_sainz': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01.png.transform/1col/image.png',
    'fernando_alonso': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01.png.transform/1col/image.png',
    'lance_stroll': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01.png.transform/1col/image.png',
    'esteban_ocon': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01.png.transform/1col/image.png',
    'pierre_gasly': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01.png.transform/1col/image.png',
    'alexander_albon': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01.png.transform/1col/image.png',
    'alex_albon': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01.png.transform/1col/image.png',
    'yuki_tsunoda': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01.png.transform/1col/image.png',
    'liam_lawson': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01.png.transform/1col/image.png',
    'nico_hulkenberg': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01.png.transform/1col/image.png',
    'kevin_magnussen': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/KEVMAG01.png.transform/1col/image.png',
    'valtteri_bottas': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01.png.transform/1col/image.png',
    'guanyu_zhou': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GUAZHO01.png.transform/1col/image.png',
    'sergio_perez': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01.png.transform/1col/image.png',
    'oliver_bearman': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01.png.transform/1col/image.png',
    'antonelli': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01.png.transform/1col/image.png',
    'franco_colapinto': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01.png.transform/1col/image.png'
  };

  // Check if we have a known URL for this driver
  const cleanId = driverId.toLowerCase().trim();
  if (knownDriverImages[cleanId]) {
    return knownDriverImages[cleanId];
  }

  // Fallback: try to construct using the standard pattern
  // Pattern: First letter of surname / First3+Last3+01
  return `https://via.placeholder.com/150/E10600/FFFFFF?text=${encodeURIComponent(driverId.split('_').join('+'))}`;
}

/**
 * Extract driver data from cached F1 API response
 */
interface DriverApiData {
  driverId: string;
  code: string;
  permanentNumber: string;
  givenName: string;
  familyName: string;
}

async function extractDriversFromCache(year: number): Promise<DriverApiData[]> {
  try {
    const cacheRecord = await db.prepare(`
      SELECT data_json
      FROM f1_api_cache
      WHERE resource_type = 'drivers'
        AND season_year = $1
      ORDER BY last_fetched_at DESC
      LIMIT 1
    `).get(year) as { data_json: string } | undefined;

    if (!cacheRecord) {
      console.warn(`No cached driver data found for ${year}`);
      return [];
    }

    const apiResponse = JSON.parse(cacheRecord.data_json);
    const drivers = apiResponse?.MRData?.DriverTable?.Drivers || [];

    return drivers.map((d: any) => ({
      driverId: d.driverId,
      code: d.code,
      permanentNumber: d.permanentNumber,
      givenName: d.givenName,
      familyName: d.familyName
    }));
  } catch (error) {
    console.error(`Error extracting drivers from cache:`, error);
    return [];
  }
}

/**
 * Update drivers table with generated image URLs
 */
export async function populateDriverImages(year: number = 2026): Promise<number> {
  console.log(`Populating driver images for ${year}...`);

  try {
    // Extract drivers from cached API data
    const apiDrivers = extractDriversFromCache(year);

    if ((await apiDrivers).length === 0) {
      console.warn('No drivers found in cached API data');
      return 0;
    }

    console.log(`Found ${(await apiDrivers).length} drivers in cached API data`);

    let updated = 0;

    for (const apiDriver of await apiDrivers) {
      const fullName = `${apiDriver.givenName} ${apiDriver.familyName}`;

      // Try to find matching driver in database
      const dbDriver = await db.prepare(`
        SELECT id, name FROM drivers
        WHERE name = $1 OR name LIKE $2
      `).get(fullName, `%${apiDriver.familyName}%`) as { id: number; name: string } | undefined;

      if (!dbDriver) {
        console.warn(`  ⚠ Driver not found in database: ${fullName}`);
        continue;
      }

      // Generate image URL using portrait pattern (newer, more reliable)
      const imageUrl = generatePortraitUrl(apiDriver.driverId, year);

      // Update driver with image URL
      db.prepare(`
        UPDATE drivers
        SET image_url = $1
        WHERE id = $2
      `).run(imageUrl, dbDriver.id);

      console.log(`  ✓ Updated ${dbDriver.name}: ${imageUrl}`);
      updated++;
    }

    console.log(`✓ Successfully updated ${updated} driver images`);
    return updated;
  } catch (error) {
    console.error('Error populating driver images:', error);
    throw error;
  }
}

/**
 * Manual mapping for drivers with different names or special cases
 */
const DRIVER_NAME_MAPPING: Record<string, string> = {
  'max_verstappen': 'Max Verstappen',
  'lewis_hamilton': 'Lewis Hamilton',
  'charles_leclerc': 'Charles Leclerc',
  'lando_norris': 'Lando Norris',
  'oscar_piastri': 'Oscar Piastri',
  'george_russell': 'George Russell',
  'carlos_sainz': 'Carlos Sainz',
  'fernando_alonso': 'Fernando Alonso',
  'lance_stroll': 'Lance Stroll',
  'esteban_ocon': 'Esteban Ocon',
  'pierre_gasly': 'Pierre Gasly',
  'alexander_albon': 'Alex Albon',
  'yuki_tsunoda': 'Yuki Tsunoda',
  'liam_lawson': 'Liam Lawson',
  'nico_hulkenberg': 'Nico Hulkenberg',
  'kevin_magnussen': 'Kevin Magnussen',
  'valtteri_bottas': 'Valtteri Bottas',
  'guanyu_zhou': 'Guanyu Zhou',
  'sergio_perez': 'Sergio Perez',
  'kimi_antonelli': 'Andrea Kimi Antonelli',
  'oliver_bearman': 'Oliver Bearman',
  'franco_colapinto': 'Franco Colipinto',
  'gabriel_bortoleto': 'Gabriel Bortoleto',
  'isack_hadjar': 'Isack Hadjar',
  'arvid_lindblad': 'Arvid Lindblad'
};

/**
 * Get driver image URL by driver ID
 */
export async function getDriverImageUrl(driverId: number): Promise<string | null> {
  try {
    const driver = await db.prepare(`
      SELECT image_url FROM drivers WHERE id = $1
    `).get(driverId) as { image_url: string | null } | undefined;

    return driver?.image_url || null;
  } catch (error) {
    console.error(`Error getting driver image for ID ${driverId}:`, error);
    return null;
  }
}

export const driverImageService = {
  populateDriverImages,
  getDriverImageUrl,
  generatePortraitUrl
};
