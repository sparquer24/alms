import { Controller, Post, Body, HttpException, HttpStatus, Get, Query, Param, Patch, Put, Delete, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';import { AuthGuard } from '../../middleware/auth.middleware';import { stat } from 'fs';
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
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Authorization header is missing. Please include "Authorization: Bearer <token>" in your request headers.',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Access denied. Required role(s): ADMIN. Your role: USER',
        error: 'Forbidden'
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  async getUsers(@Query('role') role?: string, @Request() req?: any) {
    try {
      const adminStateId = req?.user?.stateId;
      const adminUsername = req?.user?.username;
      const adminUserId = req?.user?.sub;
      const users = await this.userService.getUsers(role, adminStateId);
      
      // Exclude the logged-in admin user from the results
      const filteredUsers = users.filter(user => user.id !== adminUserId);
      
      if (filteredUsers.length === 0) {
        const stateInfo = adminStateId ? `state ID ${adminStateId}` : 'any state (no state assigned)';
        throw new HttpException(
          `No users found for admin '${adminUsername}' in ${stateInfo}${role ? ` with role '${role}'` : ''}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return filteredUsers;
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to fetch users', error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.getUserById(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      // Note: For optimization implement dedicated service method; placeholder for now
      return user; // would filter by id in real scenario
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to fetch user', HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update User', 
    description: 'Update an existing user by ID' 
  })
  @ApiBody({
    description: 'User fields to update',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'updated_user' },
        email: { type: 'string', example: 'updated@example.com' },
        phoneNo: { type: 'string', example: '1234567890' },
        password: { type: 'string', example: 'NewPassword123!' },
        roleId: { type: 'number', example: 1 },
        stateId: { type: 'number', example: 1 },
        districtId: { type: 'number', example: 1 },
        zoneId: { type: 'number', example: 1 },
        divisionId: { type: 'number', example: 1 },
        policeStationId: { type: 'number', example: 1 }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  async updateUser(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.userService.updateUser(id, body);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update user', 
        error.status || HttpStatus.BAD_REQUEST
      );
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

