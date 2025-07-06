import { Body, Controller, Post, Res, UploadedFile, UseInterceptors, BadRequestException, HttpStatus } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CandidateResponseDto } from './dto/candidate-response.dto';

@Controller('candidates')
export class CandidateController {
    constructor(
        private readonly candidateService: CandidateService,
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file', {
        dest: './uploads/'
    }))
    async uploadCandidate(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: CreateCandidateDto,
        @Res() resp: Response
    ) {
        if (!file) {
            throw new BadRequestException('Excel file is required.');
        }
        
        if (!/\.(xlsx|xls)$/.exec(file.originalname)) {
            // Delete the uploaded file if it's not an Excel file
            fs.unlink(file.path, (err) => {
              if (err) console.error('Error deleting non-excel file:', err);
            });
            throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed.');
        }

        try {
            const excelData = await this.candidateService.processExcelFile(file.path);
            const processedData: CandidateResponseDto = {
                name: body.name,
                surname: body.surname,
                seniority: excelData.seniority,
                years: excelData.yearsOfExperience,
                availability: excelData.availability,
            }
            return resp.status(HttpStatus.OK).json(processedData);
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
