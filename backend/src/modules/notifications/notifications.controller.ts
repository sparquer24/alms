import { Controller, Get, Put, Param, Query, Req, UseGuards, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { NotificationsService } from './notifications.service';

/** In-app notification center: every route is scoped to the signed-in user. */
@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private userId(req: any): number {
    const id = Number(req.user?.sub ?? req.user?.user_id);
    if (!Number.isFinite(id)) throw new UnauthorizedException('User not identified.');
    return id;
  }

  @Get()
  @ApiOperation({ summary: "List the signed-in user's notifications, newest first" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'read', required: false, type: Boolean, description: 'true = read only, false = unread only' })
  async list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('read') read?: string,
  ) {
    const data = await this.notificationsService.listForUser(this.userId(req), {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
    });
    return { success: true, data };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications for the header bell' })
  async unreadCount(@Req() req: any) {
    const unreadCount = await this.notificationsService.unreadCount(this.userId(req));
    return { success: true, data: { unreadCount } };
  }

  @Put('read-all')
  @ApiOperation({ summary: "Mark all of the signed-in user's notifications as read" })
  async markAllAsRead(@Req() req: any) {
    const updated = await this.notificationsService.markAllAsRead(this.userId(req));
    return { success: true, data: { updated } };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markAsRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.markAsRead(this.userId(req), id);
    return { success: true, data: { id } };
  }
}
