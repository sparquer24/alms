require("dotenv").config();
const { Client } = require("pg");

const createEntry = async (event) => {
  const client = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });

  const data = JSON.parse(event.body);

  try {
    await client.connect();
    const result = await client.query(
      "INSERT INTO entries(name) VALUES($1) RETURNING *",
      [data.name]
    );
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to insert data" }),
    };
  }
};

module.exports = {
  createEntry,
};