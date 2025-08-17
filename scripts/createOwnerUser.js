import readline from 'readline';
import bcrypt from 'bcryptjs';
import { db } from '../firebase.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  try {
    console.log('Create First Owner User');
    const username = (await ask('Username: ')).trim();
    const password = await ask('Password: ');
    const role = ( await ask('Role: ')).trim().toLowerCase();
    const name = (await ask('Name: ')).trim().toLowerCase();
    if (!username || !password || !name) {
      console.log('All fields are required.');
      process.exit(1);
    }
    // Check for existing username
    const usersRef = db.collection('users');
    const existing = await usersRef.where('username', '==', username).limit(1).get();
    if (!existing.empty) {
      console.log('Username already exists.');
      process.exit(1);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const userDoc = await usersRef.add({
      username,
      password: hashedPassword,
      role,
      name
    });
    console.log(`Owner user created with ID: ${userDoc.id}`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating owner user:', err);
    process.exit(1);
  }
}
main()
/*async function checkUser(){
try{
  console.log('enter the username of the user you seek');
    const username = (await ask('Username: ')).trim();
    const userRef = db.collection('users');
const foundUser = await userRef.where('username','==',username).limit(1).get();
if(!foundUser.empty){
  console.log(`user with username (${username}) exists!!`);
  process.exit(0)
}
else{
  console.log(`user with username ${username} does not exist`);
  const query = (await ask(`Would you like to create user ${username}?(YES/NO)`)).trim();
  if(query == "YES"){
     await main();
  }
  else{
     process.exit(0)
  }
 
}
}
catch(err){
  ('something went wrong...',err);
  process.exit(1);
}
}
checkUser()
*/
