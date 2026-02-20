import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    console.log(`[AuthDebug] Validating user: ${email}`);
    if (!user) {
      console.log('[AuthDebug] User not found');
      return null;
    }
    
    console.log(`[AuthDebug] User found. ID: ${user.id}, Role: ${user.role}`);
    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(`[AuthDebug] Password match: ${isMatch}`);

    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: any) {
    // Ideally use DTO validation, but for now expect valid object
    // Should check if user exists in UsersService?
    // UsersService.create handles creation but not existence check?
    // UsersService.create just calls TypeORM save which might throw on unique email.
    // It's better to check here or catch error in controller.
    return this.usersService.create(registerDto);
  }
}
