import { Body, Controller, Post, Get, Res, UploadedFile, UseInterceptors, BadRequestException, HttpStatus } from '@nestjs/common';
import { CandidateService } from '../services/candidate.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { CreateCandidateDto } from '../../dto/create-candidate.dto';
import { CandidateResponseDto } from '../../dto/candidate-response.dto';

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
            try {
                fs.unlinkSync(file.path);
            } catch (error) {
                console.error('Error deleting non-excel file:', error);
            }
            throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed.');
        }

        try {
            const excelData = await this.candidateService.processExcelFile(file.path);
            const response: CandidateResponseDto = {
                name: body.name,
                surname: body.surname,
                seniority: excelData.seniority,
                years: excelData.yearsOfExperience,
                availability: excelData.availability,
            }
            this.candidateService.saveCandidate(response);
            return resp.status(HttpStatus.OK).json(response);
        } catch (error) {

            if (fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (error) {
                    console.error('Error deleting temporary file on error:', error);
                    throw error;
                }
            }

            console.error('Error processing candidate:', error.message);
            
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException(`Failed to process candidate data: ${error.message}`);
        }
    }

    @Get()
    async getAllCandidates(@Res() resp: Response) {
        const all = this.candidateService.getAllCandidates();
        return resp.status(HttpStatus.OK).json(all);
    }
}
