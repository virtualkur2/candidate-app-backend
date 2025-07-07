import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { InMemoryCandidateRepository } from './infrastructure/in-memory-candidate.repository';
import { CANDIDATE_REPOSITORY } from './domain/candidate.repository.interface';

@Module({
  controllers: [CandidateController],
  providers: [
    CandidateService,
    InMemoryCandidateRepository,
    { provide: CANDIDATE_REPOSITORY, useExisting: InMemoryCandidateRepository },
  ],
})
export class CandidateModule {}
