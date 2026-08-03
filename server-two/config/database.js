const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

exports.connect = async () => {
    try {
        await pool.query("SELECT 1");
        console.log("PostgreSQL Database Connected Successfully via pg.Pool");
    } catch (error) {
        console.log("DB Connection Failed");
        console.error(error);
    }
};

/**
 * Converts ES6 tagged template literals into parameterized SQL queries compatible with pg driver ($1, $2, ...)
 * Example: buildSqlQuery`SELECT * FROM "User" WHERE email = ${email}`
 */
function buildSqlQuery(strings, ...values) {
    let text = "";
    const params = [];

    strings.forEach((str, i) => {
        text += str;
        if (i < values.length) {
            params.push(values[i]);
            text += `$${params.length}`;
        }
    });

    return { text, values: params };
}

exports.db = {
    /**
     * Executes SELECT or RETURNING queries and returns array of row objects.
     */
    $query: async (strings, ...values) => {
        const { text, values: params } = buildSqlQuery(strings, ...values);
        const result = await pool.query(text, params);
        return result.rows;
    },

    /**
     * Executes INSERT, UPDATE, DELETE queries and returns query result metadata / rows.
     */
    $execute: async (strings, ...values) => {
        const { text, values: params } = buildSqlQuery(strings, ...values);
        const result = await pool.query(text, params);
        return result;
    },

    pool
};
