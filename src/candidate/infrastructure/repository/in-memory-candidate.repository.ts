import { Injectable } from '@nestjs/common';
import { Candidate } from '../../domain/candidate.entity';
import { ICandidateRepository } from '../../domain/candidate.repository.interface';

@Injectable()
export class InMemoryCandidateRepository implements ICandidateRepository {
  private readonly candidates = new Map<string, Candidate>();

  save(candidate: Candidate): Candidate {
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }

  findAll(): Candidate[] {
    return Array.from(this.candidates.values());
  }

  findById(id: string): Candidate | undefined {
    return this.candidates.get(id);
  }
} 