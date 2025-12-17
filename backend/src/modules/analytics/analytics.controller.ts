import { Controller, Get, Query, HttpException, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
    ApplicationsDataDto,
    RoleLoadDataDto,
    StateDataDto,
    AdminActivityDto,
    AnalyticsResponseDto,
} from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('admin/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('applications')
    @ApiOperation({
        summary: 'Get Applications by Week',
        description:
            'Get applications aggregated by ISO week. Optionally filter by date range.',
    })
    @ApiQuery({
        name: 'fromDate',
        required: false,
        type: String,
        description: 'Start date (ISO format: YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'toDate',
        required: false,
        type: String,
        description: 'End date (ISO format: YYYY-MM-DD)',
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved applications data',
        type: [ApplicationsDataDto],
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid date format',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async getApplicationsByWeek(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<AnalyticsResponseDto<ApplicationsDataDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            const data = await this.analyticsService.getApplicationsByWeek(fromDate, toDate);

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            console.error('Error in getApplicationsByWeek:', error);
            throw new HttpException(
                error.message || 'Failed to fetch applications data',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('role-load')
    @ApiOperation({
        summary: 'Get Role-wise Application Load',
        description:
            'Get application load distributed by role. Optionally filter by date range.',
    })
    @ApiQuery({
        name: 'fromDate',
        required: false,
        type: String,
        description: 'Start date (ISO format: YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'toDate',
        required: false,
        type: String,
        description: 'End date (ISO format: YYYY-MM-DD)',
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved role load data',
        type: [RoleLoadDataDto],
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid date format',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async getRoleLoad(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<AnalyticsResponseDto<RoleLoadDataDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            const data = await this.analyticsService.getRoleLoad(fromDate, toDate);

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            console.error('Error in getRoleLoad:', error);
            throw new HttpException(
                error.message || 'Failed to fetch role load data',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('states')
    @ApiOperation({
        summary: 'Get Application State Distribution',
        description:
            'Get application distribution by status (approved, pending, rejected). Optionally filter by date range.',
    })
    @ApiQuery({
        name: 'fromDate',
        required: false,
        type: String,
        description: 'Start date (ISO format: YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'toDate',
        required: false,
        type: String,
        description: 'End date (ISO format: YYYY-MM-DD)',
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved application state data',
        type: [StateDataDto],
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid date format',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async getApplicationStates(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<AnalyticsResponseDto<StateDataDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            const data = await this.analyticsService.getApplicationStates(fromDate, toDate);

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            console.error('Error in getApplicationStates:', error);
            throw new HttpException(
                error.message || 'Failed to fetch application states data',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('admin-activities')
    @ApiOperation({
        summary: 'Get Admin Activity Feed',
        description:
            'Get a feed of admin activities with workflow history. Optionally filter by date range.',
    })
    @ApiQuery({
        name: 'fromDate',
        required: false,
        type: String,
        description: 'Start date (ISO format: YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'toDate',
        required: false,
        type: String,
        description: 'End date (ISO format: YYYY-MM-DD)',
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved admin activities',
        type: [AdminActivityDto],
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid date format',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async getAdminActivities(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Req() req?: any,
    ): Promise<AnalyticsResponseDto<AdminActivityDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            // Extract user info from JWT
            const user = req ? (req as any).user : null;
            const userId = user?.user_id;
            const roleId = user?.role_id;

            const data = await this.analyticsService.getAdminActivities(fromDate, toDate, userId, roleId);

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            console.error('Error in getAdminActivities:', error);
            throw new HttpException(
                error.message || 'Failed to fetch admin activities',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
