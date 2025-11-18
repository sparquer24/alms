import { Controller, Post, Body, HttpException, HttpStatus, Get, Query, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { stat } from 'fs';
import { CreateUsersDto } from './dto/create-users.dto';

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
    type: CreateUsersDto,
  })
 @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    example: {
      id: '123',
      username: 'new_dcp_user',
      email: 'dcp@example.com',
      roleId: 1,
      policeStationId: 1 ,
      stateId: 1,
      distictId: 1,
      zoneId: 1,
      divisionId: 1,
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
      return users
      // .map((u: any) => ({
      //   id: u.id,
      //   username: u.username,
      //   email: u.email,
      //   role: u.role?.code || null,
      // }));
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to fetch users', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    try {
      const [user] = await this.userService.getUsers();
      // Note: For optimization implement dedicated service method; placeholder for now
      return user; // would filter by id in real scenario
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to fetch user', HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.userService.updateUser(id, body);
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to update user', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    try {
      return await this.userService.deleteUser(id);
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to delete user', HttpStatus.BAD_REQUEST);
    }
  }
}

