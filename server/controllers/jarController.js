const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');

// Helper function to read and write to db.json
const readDB = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Get all jars for a user
exports.getJars = (req, res) => {
  try {
    const db = readDB();
    const userJars = db.jars.filter(jar => jar.userId === req.user.id);
    res.json(userJars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jars', error: error.message });
  }
};

// Get a single jar by ID
exports.getJar = (req, res) => {
  try {
    const db = readDB();
    const jar = db.jars.find(j => j.id === req.params.id && j.userId === req.user.id);
    
    if (!jar) {
      return res.status(404).json({ message: 'Jar not found' });
    }
    
    res.json(jar);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jar', error: error.message });
  }
};

// Create a new jar
exports.createJar = (req, res) => {
  try {
    const db = readDB();
    const { name, targetAmount, description } = req.body;
    
    const newJar = {
      id: Date.now().toString(),
      userId: req.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      balance: 0,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.jars.push(newJar);
    writeDB(db);
    
    res.status(201).json(newJar);
  } catch (error) {
    res.status(500).json({ message: 'Error creating jar', error: error.message });
  }
};

// Update a jar
exports.updateJar = (req, res) => {
  try {
    const db = readDB();
    const { name, targetAmount, description } = req.body;
    const jarIndex = db.jars.findIndex(j => j.id === req.params.id && j.userId === req.user.id);
    
    if (jarIndex === -1) {
      return res.status(404).json({ message: 'Jar not found' });
    }
    
    const updatedJar = {
      ...db.jars[jarIndex],
      name: name || db.jars[jarIndex].name,
      targetAmount: targetAmount ? parseFloat(targetAmount) : db.jars[jarIndex].targetAmount,
      description: description || db.jars[jarIndex].description,
      updatedAt: new Date().toISOString()
    };
    
    db.jars[jarIndex] = updatedJar;
    writeDB(db);
    
    res.json(updatedJar);
  } catch (error) {
    res.status(500).json({ message: 'Error updating jar', error: error.message });
  }
};

// Delete a jar
exports.deleteJar = (req, res) => {
  try {
    const db = readDB();
    const jarIndex = db.jars.findIndex(j => j.id === req.params.id && j.userId === req.user.id);
    
    if (jarIndex === -1) {
      return res.status(404).json({ message: 'Jar not found' });
    }
    
    // Delete associated transactions
    db.transactions = db.transactions.filter(t => t.jarId !== req.params.id);
    
    // Delete the jar
    db.jars.splice(jarIndex, 1);
    writeDB(db);
    
    res.json({ message: 'Jar deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting jar', error: error.message });
  }
}; 