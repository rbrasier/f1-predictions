
export const name = 'Uppercase papaya invite code';

export async function up(db: any) {
  await db.query(`
    UPDATE leagues
    SET invite_code = 'PAPAYA'
    WHERE invite_code = 'papaya'
  `);

  console.log('  Updated papaya league invite code to uppercase');
}
