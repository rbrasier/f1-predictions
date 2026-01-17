export const name = 'Clear corrupted F1 API cache from timezone fix';

export async function up(db: any) {
  // Clear all corrupted cache data that has incorrect timestamps from before the timezone fix
  await db.query('DELETE FROM f1_api_cache');
  console.log('  Cleared corrupted F1 API cache - will be repopulated on next requests');
}
