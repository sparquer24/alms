import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: any) {
    try {
      const user = await this.userService.createUser(createUserDto);
      return user;
    } catch (error: any) {
      throw new HttpException(error.message || 'User creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getUsers(@Query('role') role?: string) {
    try {
      const users = await this.userService.getUsers(role);
      // Format response as required, but return role code if present
      return users.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role?.code || null,
      }));
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to fetch users', HttpStatus.BAD_REQUEST);
    }
  }
}

