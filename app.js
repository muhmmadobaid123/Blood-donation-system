const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views'));

// Oracle DB connection
const dbConfig = {
    user: 'huzaifa_24SP_011_SE',
    password: '4892432Huzu',
    connectString: 'localhost:1521/ORCLPDB'
};

app.post('/login', async (req, res) => {
    const { username, password, role } = req.body; // ✅ Include role from form
    console.log("Trying to login with:", username, password, role);

    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM users WHERE username = :username AND password = :password AND role = :role`,
            { username, password, role }
        );

        if (result.rows.length > 0) {
            if (role === 'admin') {
                console.log("Admin login successful");
                res.redirect('/admin.html');
            } else {
                console.log("User login successful");
                res.redirect('/dashboard.html');
            }
        } else {
            res.send("Invalid credentials");
        }

        await connection.close();
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Internal Server Error");
    }
});






app.post('/register', async (req, res) => {
    console.log("Form Data Received:", req.body);

    const { username, email, phone, city, password, blood_group, role } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `INSERT INTO USERS (USERNAME, EMAIL, CONTACT, CITY, PASSWORD, BLOOD_GROUP, ROLE)
             VALUES (:username, :email, :phone, :city, :password, :blood_group, :role)`,
            { username, email, phone, city, password, blood_group, role },
            { autoCommit: true }
        );

        console.log("User registered successfully");
        res.redirect('/login.html');
        await connection.close();
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).send("Registration failed.");
    }
});


app.post('/request', async (req, res) => {
    const { name, blood_group, units_needed, contact } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `INSERT INTO blood_requests (name, blood_group, units_needed, contact)
       VALUES (:name, :blood_group, :units_needed, :contact)`,
            { name, blood_group, units_needed, contact },
            { autoCommit: true }
        );
        res.send("Blood request submitted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to submit request.");
    } finally {
        if (connection) await connection.close();
    }
});

app.get('/view-requests', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT * FROM blood_requests ORDER BY request_date DESC`);

        // Build HTML
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Admin Panel - Blood Requests</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container mt-5">
            <h2 class="text-center text-danger mb-4">Admin Panel</h2>

            <div>
                <h4 class="text-secondary">Blood Requests</h4>
                <table class="table table-bordered table-striped">
                    <thead class="table-danger">
                        <tr>
                            <th>ID</th>
                            <th>Patient</th>
                            <th>Blood Group</th>
                            <th>Units Needed</th>
                            <th>Contact</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>`;

        result.rows.forEach(r => {
            html += `
                        <tr>
                            <td>${r[0]}</td>
                            <td>${r[1]}</td>
                            <td>${r[2]}</td>
                            <td>${r[3]}</td>
                            <td>${r[4]}</td>
                            <td>${r[5] ? new Date(r[5]).toLocaleDateString() : 'N/A'}</td>
                        </tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <a href="/admin.html" class="btn btn-secondary">Back to Admin Panel</a>
        </div>
        </body>
        </html>`;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching requests.");
    } finally {
        if (connection) await connection.close();
    }
});


app.get('/view-donors', async (req, res) => {
    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT * FROM users WHERE role = 'donor'`);

        // Build HTML page
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Admin Panel - Donors</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container mt-5">
            <h2 class="text-center text-danger mb-4">Admin Panel</h2>

            <div>
                <h4 class="text-secondary">Registered Donors</h4>
                <table class="table table-bordered table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Blood Group</th>
                            <th>City</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>`;

        result.rows.forEach(row => {
            html += `
                        <tr>
                            <td>${row[0]}</td>
                            <td>${row[1]}</td>
                            <td>${row[7]}</td>
                            <td>${row[6]}</td>
                            <td>${row[5]}</td>
                        </tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <a href="/admin.html" class="btn btn-secondary">Back to Admin Panel</a>
        </div>
        </body>
        </html>`;

        res.send(html);

        await connection.close();
    } catch (err) {
        console.error("Error fetching donors:", err);
        res.status(500).send("Error fetching donor data.");
    }
});

app.get('/view-stock', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT * FROM blood_stock`);

        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Blood Stock</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5">
                <h2 class="text-danger text-center">Blood Stock</h2>
                <table class="table table-bordered table-striped mt-4">
                    <thead class="table-dark">
                        <tr>
                            <th>Blood Group</th>
                            <th>Units Available</th>
                        </tr>
                    </thead>
                    <tbody>`;

        result.rows.forEach(row => {
            html += `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`;
        });

        html += `
                    </tbody>
                </table>
                <a href="/admin.html" class="btn btn-secondary">Back to Admin Panel</a>
            </div>
        </body>
        </html>`;

        res.send(html);
    } catch (err) {
        console.error("Error fetching blood stock:", err);
        res.status(500).send("Failed to retrieve blood stock.");
    } finally {
        if (connection) await connection.close();
    }
});


app.post('/update-stock', async (req, res) => {
    const { blood_group, units, action } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        if (action === 'add') {
            // Insert new blood group
            await connection.execute(
                `INSERT INTO blood_stock (blood_group, units_available) VALUES (:bg, :units)`,
                { bg: blood_group.toUpperCase(), units: parseInt(units) },
                { autoCommit: true }
            );
            res.send(`<h3>Blood group ${blood_group} added with ${units} units.</h3><a href="/view-stock">Back</a>`);

        } else if (action === 'update') {
            // Update existing blood group units
            const result = await connection.execute(
                `UPDATE blood_stock SET units_available = :units WHERE blood_group = :bg`,
                { units: parseInt(units), bg: blood_group.toUpperCase() },
                { autoCommit: true }
            );

            if (result.rowsAffected === 0) {
                res.send(`<h3>No such blood group found to update.</h3><a href="/view-stock">Back</a>`);
            } else {
                res.send(`<h3>Blood group ${blood_group} updated to ${units} units.</h3><a href="/view-stock">Back</a>`);
            }
        } else {
            res.status(400).send("Invalid action.");
        }

    } catch (err) {
        console.error("Stock update error:", err);
        res.status(500).send("Failed to update blood stock.");
    } finally {
        if (connection) await connection.close();
    }
});

// Serve the search form
app.get('/search-donors-form', (req, res) => {
    res.sendFile(__dirname + '/views/search-donors.html');
});

// Handle the search query
app.get('/search-donors', async (req, res) => {
    const { blood_group, city } = req.query;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT USERNAME, BLOOD_GROUP, CITY, CONTACT
             FROM USERS
             WHERE ROLE = 'donor'
             AND (:bg IS NULL OR BLOOD_GROUP = :bg)
             AND (:city IS NULL OR CITY = :city)`,
            { bg: blood_group || null, city: city || null }
        );

        let html = `
        <html>
        <head>
            <title>Search Results</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container mt-5">
            <h2 class="text-center text-success mb-4">Search Results</h2>
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Blood Group</th>
                        <th>City</th>
                        <th>Contact</th>
                    </tr>
                </thead>
                <tbody>`;

        if (result.rows.length === 0) {
            html += `<tr><td colspan="4" class="text-center text-muted">No donors found.</td></tr>`;
        } else {
            result.rows.forEach(donor => {
                html += `<tr>
                    <td>${donor[0]}</td>
                    <td>${donor[1]}</td>
                    <td>${donor[2]}</td>
                    <td>${donor[3]}</td>
                </tr>`;
            });
        }

        html += `
                </tbody>
            </table>
            <a href="/admin.html" class="btn btn-secondary">Back to Search</a>
        </div>
        </body>
        </html>`;

        res.send(html);

    } catch (err) {
        console.error("Search error:", err);
        res.status(500).send("Error searching donors.");
    } finally {
        if (connection) await connection.close();
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
