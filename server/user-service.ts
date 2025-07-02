import fs from 'fs-extra';
import path from 'path';
import bcrypt from 'bcrypt';
import { User } from '@shared/schema';

const saltRounds = 10;
const dbPath = path.join(process.cwd(), 'data', 'database', 'users.json');

async function readUsers(): Promise<User[]> {
  try {
    await fs.ensureFile(dbPath);
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    if (fileContent.trim() === '') {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

async function writeUsers(users: User[]): Promise<void> {
  await fs.writeJson(dbPath, users, { spaces: 2 });
}

export async function findUser(username: string): Promise<User | undefined> {
  const users = await readUsers();
  return users.find(user => user.username === username);
}

export async function createUser(username: string, password: string): Promise<Omit<User, 'password'>> {
  const users = await readUsers();
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const maxId = users.reduce((max, user) => (user.id > max ? user.id : max), 0);
  const newUser: User = { id: maxId + 1, username, password: hashedPassword };
  
  users.push(newUser);
  await writeUsers(users);
  
  
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function deleteUser(username: string, password: string): Promise<void> {
    const users = await readUsers();
    const userIndex = users.findIndex(user => user.username === username);
    if (userIndex === -1) {
        throw new Error('User not found');
    }

    const user = users[userIndex];
    if (!user.password) {
        throw new Error('User has no password set and cannot be deleted this way.');
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
        throw new Error('Incorrect password');
    }

    users.splice(userIndex, 1);
    await writeUsers(users);
}

export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await readUsers();
    return users.map(({ password, ...rest }) => rest);
}
