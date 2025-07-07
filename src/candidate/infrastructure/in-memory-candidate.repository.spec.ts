import { InMemoryCandidateRepository } from './in-memory-candidate.repository';
import { Candidate } from '../domain/candidate.entity';

describe('InMemoryCandidateRepository', () => {
  let repo: InMemoryCandidateRepository;
  beforeEach(() => {
    repo = new InMemoryCandidateRepository();
  });

  it('should save and retrieve a candidate', () => {
    const candidate = new Candidate('id1', 'John', 'Doe', 'senior', 5, true);
    repo.save(candidate);
    expect(repo.findById('id1')).toEqual(candidate);
    expect(repo.findAll()).toContainEqual(candidate);
  });

  it('should return undefined for missing candidate', () => {
    expect(repo.findById('nope')).toBeUndefined();
  });
}); 
