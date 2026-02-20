import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export const seedAdminUser = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  const adminEmail = 'admin@insighthub.com';
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  if (!existingAdmin) {
    const admin = userRepository.create({
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      is_active: true,
    });
    await userRepository.save(admin);
    console.log('✅ Admin user seeded');
  } else {
    // Force update password to ensure it matches
    existingAdmin.password = hashedPassword;
    await userRepository.save(existingAdmin);
    console.log('ℹ️ Admin user already exists - Password updated to match seed');
  }
};
