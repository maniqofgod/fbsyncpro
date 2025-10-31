#!/usr/bin/env node
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

console.log('👤 Creating admin user...');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

try {
    const db = new Database(dbPath);

    // Check if admin user exists
    const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    if (existingAdmin) {
        console.log('ℹ️ Admin user already exists!');
        db.close();
        return;
    }

    // Create admin user
    const adminPassword = '!*GanTeng188';
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(adminPassword, saltRounds);

    const adminUserId = uuidv4();

    db.prepare(`
        INSERT INTO users (id, username, password_hash, display_name, role, created_at)
        VALUES (?, 'admin', ?, 'Administrator', 'admin', ?)
    `).run(adminUserId, hashedPassword, new Date().toISOString());

    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: !*GanTeng188');
    console.log('   Role: admin');
    console.log('   Login sekarang: http://localhost:3000');

    db.close();

} catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
}
