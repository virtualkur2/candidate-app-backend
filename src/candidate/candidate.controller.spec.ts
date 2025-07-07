import { Test, TestingModule } from '@nestjs/testing';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { SeniorityType } from './domain/seniority.type';

describe('CandidateController', () => {
  let controller: CandidateController;
  let candidateService: jest.Mocked<CandidateService>;
  let mockResponse: jest.Mocked<Response>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024,
    destination: './uploads/',
    filename: 'test.xlsx',
    path: './uploads/test.xlsx',
    buffer: Buffer.from('test'),
    stream: null as any,
  };

  const mockCreateCandidateDto: CreateCandidateDto = {
    name: 'John',
    surname: 'Doe',
  };

  const mockExcelData = {
    seniority: 'senior' as SeniorityType,
    yearsOfExperience: 5,
    availability: true,
  };

  const mockCandidateResponse: CandidateResponseDto = {
    name: 'John',
    surname: 'Doe',
    seniority: 'senior',
    years: 5,
    availability: true,
  };

  beforeEach(async () => {
    const mockCandidateService = {
      processExcelFile: jest.fn(),
      saveCandidate: jest.fn(),
      getAllCandidates: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateController],
      providers: [
        {
          provide: CandidateService,
          useValue: mockCandidateService,
        },
      ],
    }).compile();

    controller = module.get<CandidateController>(CandidateController);
    candidateService = module.get(CandidateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have candidateService injected', () => {
      expect(candidateService).toBeDefined();
    });
  });

  describe('uploadCandidate', () => {
    it('should successfully process and return candidate data without id', async () => {
      candidateService.processExcelFile.mockResolvedValue(mockExcelData);
      candidateService.saveCandidate = jest.fn().mockReturnValue({
        id: 'generated-id',
        name: mockCreateCandidateDto.name,
        surname: mockCreateCandidateDto.surname,
        seniority: mockExcelData.seniority,
        years: mockExcelData.yearsOfExperience,
        availability: mockExcelData.availability,
      });
      await controller.uploadCandidate(mockFile, mockCreateCandidateDto, mockResponse);
      expect(candidateService.processExcelFile).toHaveBeenCalledWith(mockFile.path);
      expect(candidateService.saveCandidate).toHaveBeenCalledWith({
        name: mockCreateCandidateDto.name,
        surname: mockCreateCandidateDto.surname,
        seniority: mockExcelData.seniority,
        years: mockExcelData.yearsOfExperience,
        availability: mockExcelData.availability,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        name: mockCreateCandidateDto.name,
        surname: mockCreateCandidateDto.surname,
        seniority: mockExcelData.seniority,
        years: mockExcelData.yearsOfExperience,
        availability: mockExcelData.availability,
      });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      
      await expect(
        controller.uploadCandidate(undefined as any, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCandidate(undefined as any, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow('Excel file is required.');
    });

    it('should throw BadRequestException for non-Excel files', async () => {
      
      const nonExcelFile = { ...mockFile, originalname: 'test.txt' };

      await expect(
        controller.uploadCandidate(nonExcelFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCandidate(nonExcelFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow('Only Excel files (.xlsx, .xls) are allowed.');
    });

    it('should throw BadRequestException for .xls files with wrong extension', async () => {
      
      const wrongExtensionFile = { ...mockFile, originalname: 'test.xls.txt' };

      await expect(
        controller.uploadCandidate(wrongExtensionFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCandidate(wrongExtensionFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow('Only Excel files (.xlsx, .xls) are allowed.');
    });

    it('should accept .xls files', async () => {
      
      const xlsFile = { ...mockFile, originalname: 'test.xls' };
      candidateService.processExcelFile.mockResolvedValue(mockExcelData);

      await controller.uploadCandidate(xlsFile, mockCreateCandidateDto, mockResponse);

      expect(candidateService.processExcelFile).toHaveBeenCalledWith(xlsFile.path);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('should accept .xlsx files', async () => {
      
      const xlsxFile = { ...mockFile, originalname: 'test.xlsx' };
      candidateService.processExcelFile.mockResolvedValue(mockExcelData);

      await controller.uploadCandidate(xlsxFile, mockCreateCandidateDto, mockResponse);

      expect(candidateService.processExcelFile).toHaveBeenCalledWith(xlsxFile.path);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('should handle service errors and throw BadRequestException', async () => {
      
      const serviceError = new Error('Service processing failed');
      candidateService.processExcelFile.mockRejectedValue(serviceError);

      await expect(
        controller.uploadCandidate(mockFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCandidate(mockFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow('Failed to process candidate data: Service processing failed');
    });

    it('should re-throw BadRequestException from service', async () => {
      
      const serviceBadRequestError = new BadRequestException('Invalid Excel format');
      candidateService.processExcelFile.mockRejectedValue(serviceBadRequestError);

      await expect(
        controller.uploadCandidate(mockFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCandidate(mockFile, mockCreateCandidateDto, mockResponse)
      ).rejects.toThrow('Invalid Excel format');
    });

    it('should return correct response structure with processed data', async () => {
      
      const customExcelData = {
        seniority: 'junior' as SeniorityType,
        yearsOfExperience: 2,
        availability: false,
      };
      const expectedResponse: CandidateResponseDto = {
        name: 'Jane',
        surname: 'Smith',
        seniority: 'junior',
        years: 2,
        availability: false,
      };
      candidateService.processExcelFile.mockResolvedValue(customExcelData);
      candidateService.saveCandidate.mockReturnValue({...expectedResponse, id: 'test-id'});

      const customDto: CreateCandidateDto = {
        name: 'Jane',
        surname: 'Smith',
      };

      await controller.uploadCandidate(mockFile, customDto, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle different seniority levels correctly', async () => {
      
      const juniorData = { ...mockExcelData, seniority: 'junior' as SeniorityType };
      candidateService.processExcelFile.mockResolvedValue(juniorData);

      await controller.uploadCandidate(mockFile, mockCreateCandidateDto, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockCandidateResponse,
        seniority: 'junior',
      });
    });
  });

  describe('getAllCandidates', () => {
    it('should return all persisted candidates', async () => {
      const mockCandidates = [
        { id: '1', name: 'A', surname: 'B', seniority: 'junior', years: 1, availability: true },
        { id: '2', name: 'C', surname: 'D', seniority: 'senior', years: 5, availability: false },
      ];
      candidateService.getAllCandidates = jest.fn().mockReturnValue(mockCandidates);
      const resp: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.getAllCandidates(resp);
      expect(resp.status).toHaveBeenCalledWith(200);
      expect(resp.json).toHaveBeenCalledWith(mockCandidates);
    });
  });
});
