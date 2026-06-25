import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { NotificationsService } from '../services/notifications.service';
import { PushSubscriptionsService } from '../services/push-subscriptions.service';
import { RegisterPushDto } from '../dto/register-push.dto';
import { type NotificationPayload } from '../selects/notification.select';

@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushSubscriptionsService: PushSubscriptionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async list(
    @CurrentUser() user: { id: string },
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<NotificationPayload[]> {
    return await this.notificationsService.findMany(user.id, {
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(
    @CurrentUser() user: { id: string },
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: { id: string },
    @Param('id') notificationId: string,
  ): Promise<void> {
    await this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Patch('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: { id: string }): Promise<void> {
    await this.notificationsService.markAllAsRead(user.id);
  }

  @Post('push-subscriptions')
  @HttpCode(204)
  @ApiOperation({ summary: 'Register a browser push subscription' })
  @ApiResponse({ status: 204 })
  async registerPush(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterPushDto,
  ): Promise<void> {
    await this.pushSubscriptionsService.register(user.id, dto);
  }

  @Delete('push-subscriptions')
  @HttpCode(204)
  @ApiOperation({ summary: 'Unregister a browser push subscription' })
  @ApiResponse({ status: 204 })
  async unregisterPush(
    @CurrentUser() user: { id: string },
    @Body() dto: { endpoint: string },
  ): Promise<void> {
    await this.pushSubscriptionsService.unregister(user.id, dto.endpoint);
  }
}
