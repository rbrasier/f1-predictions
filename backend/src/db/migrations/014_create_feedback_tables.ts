
export const name = 'Create feedback tables';

export async function up(db: any) {
    // Create feedback table
    await db.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature')),
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'implemented', 'fixed', 'rejected')),
      upvotes_count INTEGER DEFAULT 0,
      downvotes_count INTEGER DEFAULT 0,
      implementation_note TEXT,
      implementation_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('  Created feedback table');

    // Create feedback_votes table
    await db.query(`
    CREATE TABLE IF NOT EXISTS feedback_votes (
      id SERIAL PRIMARY KEY,
      feedback_id INTEGER NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(feedback_id, user_id)
    )
  `);

    console.log('  Created feedback_votes table');

    // Create indexes for better query performance
    await db.query(`
    CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
  `);

    await db.query(`
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
  `);

    await db.query(`
    CREATE INDEX IF NOT EXISTS idx_feedback_type_status ON feedback(type, status);
  `);

    console.log('  Created indexes for feedback tables');
}
