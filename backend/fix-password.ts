import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    console.log('Updating password for CADO_HYD...');
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const result = await prisma.users.updateMany({
      where: { username: 'CADO_HYD' },
      data: { password: hashedPassword }
    });
    
    console.log('Updated', result.count, 'user(s)');
    
    // Verify the user exists and can be authenticated
    const user = await prisma.users.findUnique({
      where: { username: 'CADO_HYD' },
      select: { username: true, email: true, password: true }
    });
    
    if (user) {
      console.log('User found:', { username: user.username, email: user.email });
      
      // Test password verification
      const isValid = await bcrypt.compare('password', user.password);
      console.log('Password verification test:', isValid ? 'PASSED' : 'FAILED');
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
