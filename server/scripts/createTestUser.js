const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');

async function createTestUser() {
  try {
    // Read current db
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // Generate password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create test user
    const testUser = {
      id: "1",
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      createdAt: new Date().toISOString()
    };
    
    // Update users array
    db.users = [testUser];
    
    // Write back to db
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    console.log('Test user created successfully!');
    console.log('Email:', testUser.email);
    console.log('Password: password123');
    console.log('Hashed password:', hashedPassword);
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser(); 