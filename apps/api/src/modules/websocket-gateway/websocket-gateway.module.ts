import { Module } from '@nestjs/common';
import { ChatbotGateway } from './chatbot.gateway';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  providers: [ChatbotGateway, NotificationsGateway],
  exports: [ChatbotGateway, NotificationsGateway],
})
export class WebSocketGatewayModule {}
