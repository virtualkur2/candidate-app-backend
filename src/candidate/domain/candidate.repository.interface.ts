import { Candidate } from './candidate.entity';

export interface ICandidateRepository {
  save(candidate: Candidate): Candidate;
  findAll(): Candidate[];
  findById(id: string): Candidate | undefined;
}

export const CANDIDATE_REPOSITORY = Symbol('CANDIDATE_REPOSITORY'); 