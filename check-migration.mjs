import mysql from "mysql2/promise";

const url = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: true,
});

try {
  const [result] = await connection.execute(
    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='lessons' AND COLUMN_NAME='class'"
  );
  console.log('Current class column type:', result[0]?.COLUMN_TYPE);
  
  if (result[0]?.COLUMN_TYPE === 'varchar(10)') {
    console.log('Applying migration...');
    await connection.execute('ALTER TABLE `lessons` MODIFY COLUMN `class` varchar(20) NOT NULL;');
    console.log('✅ Migration applied successfully');
  } else {
    console.log('✅ Migration already applied or column size is sufficient');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
