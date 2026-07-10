const voters = [
  { voter_id: 'VOTER001', name: 'Hemant Kumar', has_voted: false },
  { voter_id: 'VOTER002', name: 'Amit Sharma', has_voted: false },
  { voter_id: 'VOTER003', name: 'Priya Singh', has_voted: false },
  { voter_id: 'VOTER004', name: 'Rahul Verma', has_voted: false },
  { voter_id: 'VOTER005', name: 'Neha Gupta', has_voted: false },
];

const candidates = [
  { id: 1, name: 'Candidate A', party: 'Party Alpha', symbol: 'A', vote_count: 0 },
  { id: 2, name: 'Candidate B', party: 'Party Beta', symbol: 'B', vote_count: 0 },
  { id: 3, name: 'Candidate C', party: 'Party Gamma', symbol: 'C', vote_count: 0 },
  { id: 4, name: 'Candidate D', party: 'Party Delta', symbol: 'D', vote_count: 0 },
];

const findVoter = (voterId) => voters.find(v => v.voter_id === voterId.toUpperCase());
const findCandidate = (candidateId) => candidates.find(c => c.id === Number(candidateId));

const recordVote = (voterId, candidateId) => {
  const voter = findVoter(voterId);
  const candidate = findCandidate(candidateId);

  if (!voter || voter.has_voted || !candidate) {
    return null;
  }

  voter.has_voted = true;
  candidate.vote_count += 1;
  return candidate;
};

const resetVotes = () => {
  voters.forEach(voter => {
    voter.has_voted = false;
  });
  candidates.forEach(candidate => {
    candidate.vote_count = 0;
  });
};

module.exports = {
  voters,
  candidates,
  findVoter,
  recordVote,
  resetVotes,
};
