import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

try {
  console.log('Executing migration...');
  await db.execute(sql.raw('ALTER TABLE `lessons` MODIFY COLUMN `class` varchar(20) NOT NULL;'));
  console.log('✅ Migration executed successfully');
  process.exit(0);
} catch (error) {
  console.error('Migration error:', error.message);
  process.exit(1);
}
