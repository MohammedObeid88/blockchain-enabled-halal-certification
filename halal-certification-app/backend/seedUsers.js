const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function seedUsers() {
    await mongoose.connect('mongodb://localhost:27017/halal-certification-app', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    const users = [
        { username: 'org1', password: await bcrypt.hash('1234', 10), org: 'org1', identity: 'org1User' },
        { username: 'org2', password: await bcrypt.hash('5678', 10), org: 'org2', identity: 'org2User' },
    ];
    
    await User.deleteMany({});
    await User.insertMany(users);

    console.log('Users seeded!');
    mongoose.disconnect();
}

seedUsers();