import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);

const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: 'amazon',
});

try {
  await connection.execute('ALTER TABLE `lessons` MODIFY COLUMN `class` varchar(20) NOT NULL;');
  console.log('✅ Migration executed successfully');
} catch (error) {
  console.log('Migration result:', error.message);
} finally {
  await connection.end();
}
