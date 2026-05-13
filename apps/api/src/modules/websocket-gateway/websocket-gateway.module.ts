import { Module } from '@nestjs/common';
import { ChatbotGateway } from './chatbot.gateway';

@Module({
  providers: [ChatbotGateway],
  exports: [ChatbotGateway],
})
export class WebSocketGatewayModule {}
