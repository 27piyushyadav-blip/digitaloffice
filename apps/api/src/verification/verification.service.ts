import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class VerificationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async uploadDocument(
    expertId: string,
    file: Express.Multer.File,
    documentType: string,
  ) {
    const validDocumentTypes = [
      'degree_certificate',
      'professional_license',
      'identity_proof',
      'address_proof',
    ];

    if (!validDocumentTypes.includes(documentType)) {
      throw new BadRequestException('Invalid document type');
    }

    const fileUrl = `/uploads/verification-documents/${file.filename}`;

    // TODO: Save document to database
    // TODO: Update expert verification status
    // TODO: Notify admin for review

    return {
      message: 'Document uploaded successfully',
      documentType,
      fileUrl,
      status: 'PENDING_REVIEW',
    };
  }

  async getVerificationStatus(expertId: string) {
    // TODO: Get verification status from database
    return {
      status: 'PENDING_INITIAL',
      documents: [
        {
          id: 'doc_1',
          documentType: 'degree_certificate',
          fileUrl: '/uploads/verification-documents/certificate.pdf',
          status: 'PENDING_REVIEW',
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
  }
}
