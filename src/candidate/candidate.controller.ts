import { Body, Controller, Post, Res, UploadedFile, UseInterceptors, BadRequestException, HttpStatus } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {Response} from 'express';
import * as fs from 'fs';

@Controller('candidates')
export class CandidateController {
    constructor(
        private readonly candidateService: CandidateService,
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadCandidate(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: unknown,
        @Res() resp: Response
    ) {
        if (!file) {
            throw new BadRequestException('Excel file is required.');
        }
        
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
            // Delete the uploaded file if it's not an Excel file
            fs.unlink(file.path, (err) => {
              if (err) console.error('Error deleting non-excel file:', err);
            });
            throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed.');
        }

        try {
            return resp.status(HttpStatus.OK).json({});
        } catch (error) {

            if (fs.existsSync(file.path)) {
                fs.unlink(file.path, (err) => {
                  if (err) console.error('Error deleting temporary file on error:', err);
                });
            }

            console.error('Error processing candidate:', error.message);
            
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException(`Failed to process candidate data: ${error.message}`);
        }
    }
}
