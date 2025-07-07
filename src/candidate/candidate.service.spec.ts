import { CandidateService } from './candidate.service';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';


describe('CandidateService', () => {
  let service: CandidateService;

  beforeEach(() => {
    service = new CandidateService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const filePath = 'test.xlsx';

  function mockXLSXReadFile(headers: string[], row: any[]) {
    jest.spyOn(XLSX, 'readFile').mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: 'sheet',
      },
    } as any);
    jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([headers, row]);
  }

  it('should process a valid Excel file', async () => {
    mockXLSXReadFile(['Seniority', 'Years of experience', 'Availability'], ['senior', 3, 'yes']);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation();

    const result = await service.processExcelFile(filePath);
    expect(result).toEqual({
      seniority: 'senior',
      yearsOfExperience: 3,
      availability: true,
    });
    expect(unlinkSpy).toHaveBeenCalledWith(filePath);
  });

  it('should throw if Excel file has less than 2 rows', async () => {
    jest.spyOn(XLSX, 'readFile').mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: 'sheet' },
    } as any);
    jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([['Seniority', 'Years of experience', 'Availability']]);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlinkSync').mockImplementation();

    await expect(service.processExcelFile(filePath)).rejects.toThrow('Excel file must contain at least one row of data after headers.');
  });

  it('should throw if required columns are missing', async () => {
    mockXLSXReadFile(['Seniority', 'Years of experience'], ['senior', 3]);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlinkSync').mockImplementation();

    await expect(service.processExcelFile(filePath)).rejects.toThrow('Excel file is missing one or more required columns');
  });

  it('should throw if seniority is invalid', async () => {
    mockXLSXReadFile(['Seniority', 'Years of experience', 'Availability'], ['mid', 3, 'yes']);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlinkSync').mockImplementation();

    await expect(service.processExcelFile(filePath)).rejects.toThrow('Invalid Seniority value in Excel');
  });

  it('should throw if years of experience is invalid', async () => {
    mockXLSXReadFile(['Seniority', 'Years of experience', 'Availability'], ['senior', 'notanumber', 'yes']);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlinkSync').mockImplementation();

    await expect(service.processExcelFile(filePath)).rejects.toThrow('Years of experience in Excel must be a non-negative number.');
  });

  it('should throw if availability is invalid', async () => {
    mockXLSXReadFile(['Seniority', 'Years of experience', 'Availability'], ['senior', 3, 'maybe']);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlinkSync').mockImplementation();

    await expect(service.processExcelFile(filePath)).rejects.toThrow('Invalid Availability value in Excel');
  });

  it('should handle false/0/no for availability', async () => {
    for (const val of ['false', 'no', '0']) {
      mockXLSXReadFile(['Seniority', 'Years of experience', 'Availability'], ['junior', 1, val]);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation();
      const result = await service.processExcelFile(filePath);
      expect(result).toEqual({
        seniority: 'junior',
        yearsOfExperience: 1,
        availability: false,
      });
    }
  });

  it('should handle true/yes/1 for availability', async () => {
    for (const val of ['true', 'yes', '1']) {
      mockXLSXReadFile(['Seniority', 'Years of experience', 'Availability'], ['junior', 2, val]);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation();
      const result = await service.processExcelFile(filePath);
      expect(result).toEqual({
        seniority: 'junior',
        yearsOfExperience: 2,
        availability: true,
      });
    }
  });

  it('should throw BadRequestException and clean up file on unexpected error', async () => {
    jest.spyOn(XLSX, 'readFile').mockImplementation(() => { throw new Error('boom'); });
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation();

    await expect(service.processExcelFile(filePath)).rejects.toThrow(BadRequestException);
    expect(unlinkSpy).toHaveBeenCalledWith(filePath);
  });
});
