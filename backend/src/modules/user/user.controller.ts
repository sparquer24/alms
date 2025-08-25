import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create User', 
    description: 'Create a new user in the system' 
  })
  @ApiBody({
    description: 'User creation data',
    examples: {
      'DCP User': {
        value: {
          username: 'new_dcp_user',
          email: 'dcp@example.com',
          password: 'securePassword123',
          role: 'DCP'
        }
      },
      'Applicant': {
        value: {
          username: 'new_applicant',
          email: 'applicant@example.com',
          password: 'securePassword123',
          role: 'APPLICANT'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    example: {
      id: '123',
      username: 'new_dcp_user',
      email: 'dcp@example.com',
      role: 'DCP',
      createdAt: '2025-08-20T12:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid user data' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createUser(@Body() createUserDto: any) {
    try {
      const user = await this.userService.createUser(createUserDto);
      return user;
    } catch (error: any) {
      throw new HttpException(error.message || 'User creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get Users', 
    description: 'Retrieve all users or filter by role' 
  })
  @ApiQuery({ 
    name: 'role', 
    required: false, 
    description: 'Filter users by role',
    example: 'DCP',
    enum: ['APPLICANT', 'SHO', 'ZS', 'ACP', 'DCP', 'CP', 'ADMIN', 'ARMS_SUPDT']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    example: [
      {
        id: '1',
        username: 'dcp_user',
        email: 'dcp@example.com',
        role: 'DCP'
      },
      {
        id: '2',
        username: 'acp_user',
        email: 'acp@example.com',
        role: 'ACP'
      }
    ]
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid role filter' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

