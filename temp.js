var oracledb = require('oracledb');

async function run() {

  let connection;

  try {
    connection = await oracledb.getConnection(  {
      user          : "mani",
      password      : "test1234",
      connectString : "oracle.cise.ufl.edu/orcl"
    });

    // let result = await connection.execute(
    //   `SELECT manager_id, department_id, department_name
    //    FROM departments
    //    WHERE manager_id = :id`,
    //   [103],  // bind value for :id
    // );

    let result = await connection.execute('SELECT * FROM ATHLETE WHERE ID = 6157');

    console.log(result.rows);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();