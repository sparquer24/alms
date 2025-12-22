import { Controller, Get, Query, HttpException, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
    ApplicationsDataDto,
    RoleLoadDataDto,
    StateDataDto,
    AdminActivityDto,
    AnalyticsResponseDto,
    ApplicationRecordDto,
} from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard)
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
        @Req() req?: any,
    ): Promise<AnalyticsResponseDto<ApplicationsDataDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            // Extract user info from JWT for state filtering
            const user = req ? (req as any).user : null;
            const stateId = user?.stateId;
            const roleCode = user?.roleCode;

            const data = await this.analyticsService.getApplicationsByWeek(fromDate, toDate, stateId, roleCode);

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
        @Req() req?: any,
    ): Promise<AnalyticsResponseDto<RoleLoadDataDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            // Extract user info from JWT for state filtering
            const user = req ? (req as any).user : null;
            const stateId = user?.stateId;
            const roleCode = user?.roleCode;

            const data = await this.analyticsService.getRoleLoad(fromDate, toDate, stateId, roleCode);

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
        @Req() req?: any,
    ): Promise<AnalyticsResponseDto<StateDataDto[]>> {
        try {
            // Validate date format if provided
            if (fromDate && isNaN(Date.parse(fromDate))) {
                throw new HttpException('Invalid fromDate format', HttpStatus.BAD_REQUEST);
            }
            if (toDate && isNaN(Date.parse(toDate))) {
                throw new HttpException('Invalid toDate format', HttpStatus.BAD_REQUEST);
            }

            // Extract user info from JWT for state filtering
            const user = req ? (req as any).user : null;
            const stateId = user?.stateId;
            const roleCode = user?.roleCode;

            const data = await this.analyticsService.getApplicationStates(fromDate, toDate, stateId, roleCode);

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
            const userId = user?.userId;
            const roleId = user?.roleId;
            const stateId = user?.stateId;
            const roleCode = user?.roleCode;

            const data = await this.analyticsService.getAdminActivities(fromDate, toDate, userId, roleId, stateId, roleCode);

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

    @Get('applications/details')
    @ApiOperation({
        summary: 'Get Applications Details',
        description:
            'Get applications summary counts and a list of applications. Supports optional status filter (APPROVED, PENDING, REJECTED).',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        type: String,
        description: 'Optional status filter: APPROVED | PENDING | REJECTED',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number for pagination (1-based)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of items per page',
    })
    @ApiQuery({
        name: 'q',
        required: false,
        type: String,
        description: 'Optional search string to match license id or username',
    })
    @ApiQuery({
        name: 'sort',
        required: false,
        type: String,
        description: "Optional sort field, prefix with '-' for desc (e.g. '-updatedAt')",
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved applications details',
        // data contains summary + array of records
    })
    async getApplicationsDetails(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
        @Query('sort') sort?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Req() req?: any,
    ): Promise<AnalyticsResponseDto<ApplicationRecordDto[]>> {
        try {
            const pageNum = page ? parseInt(page, 10) : undefined;
            const limitNum = limit ? parseInt(limit, 10) : undefined;

            // Extract user info from JWT for state filtering
            const user = req ? (req as any).user : null;
            const stateId = user?.stateId;
            const roleCode = user?.roleCode;

            const result = await this.analyticsService.getApplicationsDetails(status, pageNum, limitNum, q, sort, fromDate, toDate, stateId, roleCode);

            const pages = result.limit && result.limit > 0 ? Math.ceil((result.total || 0) / result.limit) : 1;

            return {
                success: true,
                data: result.data,
                meta: {
                    total: result.total,
                    page: result.page ?? 1,
                    limit: result.limit ?? result.data.length,
                    pages,
                },
            };
        } catch (error: any) {
            console.error('Error in getApplicationsDetails:', error);
            throw new HttpException(
                error.message || 'Failed to fetch applications details',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
