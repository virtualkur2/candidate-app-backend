import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';


interface CandidateData {
    seniority: 'junior' | 'senior';
    yearsOfExperience: number;
    availability: boolean;
}
@Injectable()
export class CandidateService {
    async processExcelFile(filePath: string): Promise<CandidateData> {
        try {
            const workBook = XLSX.readFile(filePath);
            const sheetName = workBook.SheetNames[0];
            const workSheet = workBook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(workSheet, {header: 1});
            
            if (jsonData.length < 2) {
                throw new BadRequestException('Excel file must contain at least one row of data after headers.');
            }

            const headers = jsonData[0] as string[];
            const dataRow = jsonData[1] as unknown[];

            const seniorityIndex = this.findColumnIndex('Seniority', headers);
            const yearsOfExperienceIndex = this.findColumnIndex('Years of experience', headers);
            const availabilityIndex = this.findColumnIndex('Availability', headers);

            if ([seniorityIndex, yearsOfExperienceIndex, availabilityIndex].some(index => index === -1)) {
                throw new BadRequestException('Excel file is missing one or more required columns: "Seniority", "Years of experience", "Availability". Please ensure correct spelling and case.');
            }

            const seniorityRaw = String(dataRow[seniorityIndex]).toLowerCase().trim();
            const yearsOfExperienceRaw = Number(dataRow[yearsOfExperienceIndex]);
            const availabilityRaw = String(dataRow[availabilityIndex]).toLowerCase().trim();

            if (!['junior', 'senior'].includes(seniorityRaw)) {
                throw new BadRequestException('Invalid Seniority value in Excel. Must be "junior" or "senior".');
            }

            const seniority: 'junior' | 'senior' = seniorityRaw as 'junior' | 'senior';

            if (isNaN(yearsOfExperienceRaw) || yearsOfExperienceRaw < 0) {
                throw new BadRequestException('Years of experience in Excel must be a non-negative number.');
            }

            let availability: boolean;
            if (['true', 'yes', '1'].includes(availabilityRaw)) {
                availability = true;
            } else if (['false', 'no', '0'].includes(availabilityRaw)) {
                availability = false;
            } else {
                throw new BadRequestException('Invalid Availability value in Excel. Must be "true", "false", "yes", "no", "1", or "0".');
            }

            return {
                seniority,
                yearsOfExperience: yearsOfExperienceRaw,
                availability,
              };

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error reading Excel file:', error);
            throw new BadRequestException(`Error processing Excel file: ${error.message ?? 'Invalid file format or content.'}`);
        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    private findColumnIndex(targetHeader: string, headers: string[]): number {
        return headers.findIndex(h => h.toLowerCase().includes(targetHeader.toLowerCase()));
    };
}
