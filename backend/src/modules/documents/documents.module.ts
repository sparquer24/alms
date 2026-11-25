import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentClassifierService } from './services/document-classifier.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentClassifierService],
  exports: [DocumentsService, DocumentClassifierService],
})
export class DocumentsModule {}
