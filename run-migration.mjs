import { drizzle } from "drizzle-orm/mysql2/driver";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);

const poolConnection = await mysql.createPool({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: "amazon",
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

const db = drizzle(poolConnection, { schema });

try {
  // Execute raw SQL to alter the column
  const connection = await poolConnection.getConnection();
  await connection.execute('ALTER TABLE `lessons` MODIFY COLUMN `class` varchar(20) NOT NULL;');
  console.log('✅ Migration executed successfully');
  connection.release();
} catch (error) {
  console.error('Migration error:', error.message);
} finally {
  await poolConnection.end();
  process.exit(0);
}
