-- USERS TABLE (for login)
CREATE TABLE users (
    user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR2(50) NOT NULL UNIQUE,
    password VARCHAR2(100) NOT NULL,
    role VARCHAR2(10) CHECK (role IN ('donor', 'admin'))
);

-- DONORS TABLE
CREATE TABLE donors (
    donor_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100),
    age NUMBER,
    gender VARCHAR2(10),
    blood_group VARCHAR2(5),
    contact VARCHAR2(20),
    address VARCHAR2(255),
    last_donation_date DATE
);

-- BLOOD STOCK TABLE
CREATE TABLE blood_stock (
    blood_group VARCHAR2(5) PRIMARY KEY,
    units_available NUMBER
);

-- BLOOD REQUESTS TABLE
CREATE TABLE blood_requests (
    request_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100),
    blood_group VARCHAR2(5),
    units_needed NUMBER,
    contact VARCHAR2(20),
    request_date DATE DEFAULT SYSDATE,
    status VARCHAR2(20) DEFAULT 'Pending'
);

ALTER TABLE USERS
ADD (
  EMAIL        VARCHAR2(100),
  CONTACT      VARCHAR2(20),
  CITY         VARCHAR2(50),
  BLOOD_GROUP  VARCHAR2(5)
);


select * from blood_requests;
select * from users;
select * blood_stock;
DESC USERS;


SELECT * FROM users WHERE role = 'donor';
