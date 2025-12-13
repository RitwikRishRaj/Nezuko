class RatingCalculator {
  constructor() {
    this.KBASE = 32;
    this.PENALTY_PER_WRONG = 20; // minutes
  }

  /**
   * Calculate Mexp based on Codeforces rating
   */
  calculateMexp(cfRating) {
    if (cfRating < 800) return 1.7;
    if (cfRating < 1200) return 1.5;
    if (cfRating < 1400) return 1.25;
    if (cfRating < 1800) return 1.0;
    return 0.8;
  }

  /**
   * Alternative Mexp formula if needed
   */
  calculateMexpFormula(rating) {
    return 0.8 + (0.9 / (1 + Math.pow((rating - 800) / 450, 2)));
  }

  /**
   * Calculate expected result E = 1/(1+10^((Ro-Rp)/400))
   */
  calculateExpectedResult(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Calculate ICPC penalty for a participant
   */
  calculateICPCPenalty(submissions) {
    let totalPenalty = 0;
    const problemsSolved = {};

    // Group submissions by problem
    submissions.forEach(sub => {
      if (!problemsSolved[sub.problemId || sub.problem_id]) {
        problemsSolved[sub.problemId || sub.problem_id] = {
          solveTime: null,
          wrongAttempts: 0,
          solved: false
        };
      }

      const problemId = sub.problemId || sub.problem_id;
      
      if (sub.status === 'accepted' && !problemsSolved[problemId].solved) {
        // Use time_from_start if available (in seconds), otherwise calculate from submission_time
        if (sub.time_from_start !== undefined && sub.time_from_start !== null) {
          problemsSolved[problemId].solveTime = sub.time_from_start / 60; // Convert seconds to minutes
        } else if (sub.submissionTime || sub.submission_time) {
          // Fallback: calculate from timestamp (this should be avoided in production)
          const timeMinutes = new Date(sub.submissionTime || sub.submission_time).getTime() / (1000 * 60);
          problemsSolved[problemId].solveTime = timeMinutes;
        } else {
          // Default fallback
          problemsSolved[problemId].solveTime = 0;
        }
        problemsSolved[problemId].solved = true;
      } else if (sub.status !== 'accepted' && !problemsSolved[problemId].solved) {
        problemsSolved[problemId].wrongAttempts++;
      }
    });

    // Calculate penalty: Tsolve,i + Wi * X (where X = PENALTY_PER_WRONG)
    Object.values(problemsSolved).forEach(problem => {
      if (problem.solved) {
        const solveTimeMinutes = problem.solveTime || 0;
        const wrongPenalty = problem.wrongAttempts * this.PENALTY_PER_WRONG;
        totalPenalty += solveTimeMinutes + wrongPenalty;
      }
    });

    return {
      penalty: totalPenalty,
      problemsSolved: Object.values(problemsSolved).filter(p => p.solved).length
    };
  }

  /**
   * Calculate ICPC Mperf based on penalty ratio
   */
  calculateICPCMperf(playerPenalty, opponentPenalty, isWinner) {
    if (!isWinner) return 1.0;

    const pratio = playerPenalty / opponentPenalty;
    
    if (pratio < 0.7) return 1.25;
    if (pratio < 0.9) return 1.15;
    if (pratio <= 1.1) return 1.0;
    if (pratio <= 1.4) return 0.9;
    return 0.8;
  }

  /**
   * Alternative ICPC Mperf formula
   */
  calculateICPCMperfFormula(playerPenalty, opponentPenalty) {
    const pratio = playerPenalty / opponentPenalty;
    return 1 + 0.25 * Math.tanh(2 * (1 - pratio));
  }

  /**
   * Calculate IOI final score time (Tp)
   */
  calculateIOIFinalScoreTime(submissions) {
    let currentScore = 0;
    let finalScoreTime = 0;
    const problemScores = {};

    // Sort submissions by time_from_start (preferred) or submission time
    const sortedSubmissions = submissions.sort((a, b) => {
      const timeA = a.time_from_start !== undefined ? a.time_from_start : 
                   new Date(a.submissionTime || a.submission_time).getTime();
      const timeB = b.time_from_start !== undefined ? b.time_from_start : 
                   new Date(b.submissionTime || b.submission_time).getTime();
      return timeA - timeB;
    });

    sortedSubmissions.forEach(sub => {
      const newScore = sub.score || 0;
      const problemId = sub.problemId || sub.problem_id;
      
      // If this submission improves the score for this problem
      if (!problemScores[problemId] || newScore > problemScores[problemId]) {
        const scoreDiff = newScore - (problemScores[problemId] || 0);
        problemScores[problemId] = newScore;
        currentScore += scoreDiff;
        
        // Update final score time to this submission time
        if (sub.time_from_start !== undefined && sub.time_from_start !== null) {
          finalScoreTime = sub.time_from_start / 60; // Convert seconds to minutes
        } else if (sub.submissionTime || sub.submission_time) {
          // Fallback: use timestamp (should be avoided in production)
          finalScoreTime = new Date(sub.submissionTime || sub.submission_time).getTime() / (1000 * 60);
        }
      }
    });

    return {
      finalScore: currentScore,
      finalScoreTime: finalScoreTime // Already in minutes
    };
  }

  /**
   * Calculate IOI Mperf based on time ratio
   */
  calculateIOIMperf(playerTime, opponentTime, isWinner) {
    if (!isWinner) return 1.0;

    const tratio = playerTime / opponentTime;
    
    if (tratio < 0.6) return 1.25;
    if (tratio < 0.85) return 1.15;
    if (tratio <= 1.15) return 1.0;
    if (tratio <= 1.5) return 0.9;
    return 0.8;
  }

  /**
   * Alternative IOI Mperf formula
   */
  calculateIOIMperfFormula(playerTime, opponentTime) {
    const tratio = playerTime / opponentTime;
    return 1 + 0.25 * Math.tanh(2 * (1 - tratio));
  }

  /**
   * Calculate new rating
   */
  calculateNewRating(playerRating, opponentRating, actualResult, cfRating, format, playerData, opponentData) {
    // Calculate expected result
    const expectedResult = this.calculateExpectedResult(playerRating, opponentRating);
    
    // Calculate Mexp
    const mexp = this.calculateMexp(cfRating);
    
    // Calculate Mperf based on format
    let mperf = 1.0;
    
    if (format === 'icpc') {
      const playerPenalty = this.calculateICPCPenalty(playerData.submissions).penalty;
      const opponentPenalty = this.calculateICPCPenalty(opponentData.submissions).penalty;
      const isWinner = actualResult === 1;
      mperf = this.calculateICPCMperf(playerPenalty, opponentPenalty, isWinner);
    } else if (format === 'ioi') {
      const playerTimeData = this.calculateIOIFinalScoreTime(playerData.submissions);
      const opponentTimeData = this.calculateIOIFinalScoreTime(opponentData.submissions);
      const isWinner = actualResult === 1;
      mperf = this.calculateIOIMperf(playerTimeData.finalScoreTime, opponentTimeData.finalScoreTime, isWinner);
    } else if (format === 'long') {
      mperf = 1.0; // No performance bonus/penalty for LONG format
    }
    
    // Calculate K factor
    const k = this.KBASE * mexp * mperf;
    const kFinal = Math.max(10, Math.min(k, 60));
    
    // Calculate new rating
    const newRating = playerRating + kFinal * (actualResult - expectedResult);
    
    return {
      oldRating: playerRating,
      newRating: Math.round(newRating),
      expectedResult,
      actualResult,
      kFactor: kFinal,
      mexp,
      mperf,
      ratingChange: Math.round(newRating - playerRating)
    };
  }

  /**
   * Calculate team performance metrics
   */
  calculateTeamPerformance(teamMembers, format) {
    let teamPenalty = 0;
    let teamScore = 0;
    let teamFinalTime = 0;
    let teamProblemsSolved = 0;

    if (format === 'icpc') {
      // ICPC: Sum all team member penalties
      teamMembers.forEach(member => {
        const memberData = this.calculateICPCPenalty(member.submissions);
        teamPenalty += memberData.penalty;
        teamProblemsSolved += memberData.problemsSolved;
      });
    } else if (format === 'ioi') {
      // IOI: Sum scores and use latest final score time
      teamMembers.forEach(member => {
        const memberData = this.calculateIOIFinalScoreTime(member.submissions);
        teamScore += memberData.finalScore;
        teamFinalTime = Math.max(teamFinalTime, memberData.finalScoreTime);
      });
    } else if (format === 'long') {
      // LONG: Sum scores
      teamMembers.forEach(member => {
        teamScore += member.finalScore || 0;
      });
    }

    return {
      penalty: teamPenalty,
      score: teamScore,
      finalTime: teamFinalTime,
      problemsSolved: teamProblemsSolved,
      avgRating: Math.round(teamMembers.reduce((sum, m) => sum + m.currentRating, 0) / teamMembers.length)
    };
  }

  /**
   * Calculate rating changes for all participants in a session
   */
  calculateSessionRatings(participants, format, roomMode = '1v1') {
    const results = [];
    
    if (roomMode === '1v1') {
      // 1v1: Direct pairwise calculation
      const sortedParticipants = participants.sort((a, b) => a.rank - b.rank);
      
      for (let i = 0; i < sortedParticipants.length; i++) {
        for (let j = i + 1; j < sortedParticipants.length; j++) {
          const player = sortedParticipants[i];
          const opponent = sortedParticipants[j];
          
          // Player wins (better rank)
          const playerResult = this.calculateNewRating(
            player.currentRating,
            opponent.currentRating,
            1, // Win
            player.cfRating,
            format,
            player,
            opponent
          );
          
          // Opponent loses
          const opponentResult = this.calculateNewRating(
            opponent.currentRating,
            player.currentRating,
            0, // Loss
            opponent.cfRating,
            format,
            opponent,
            player
          );
          
          results.push({
            playerId: player.userId,
            ...playerResult
          });
          
          results.push({
            playerId: opponent.userId,
            ...opponentResult
          });
        }
      }
      
      // Aggregate rating changes for each player
      const aggregatedResults = {};
      results.forEach(result => {
        if (!aggregatedResults[result.playerId]) {
          aggregatedResults[result.playerId] = {
            playerId: result.playerId,
            oldRating: result.oldRating,
            totalRatingChange: 0,
            matches: 0
          };
        }
        
        aggregatedResults[result.playerId].totalRatingChange += result.ratingChange;
        aggregatedResults[result.playerId].matches++;
      });
      
      // Calculate average rating change
      Object.values(aggregatedResults).forEach(player => {
        player.averageRatingChange = Math.round(player.totalRatingChange / player.matches);
        player.newRating = player.oldRating + player.averageRatingChange;
      });
      
      return Object.values(aggregatedResults);
      
    } else if (roomMode === 'team-vs-team') {
      // Team vs Team: Calculate team performance and apply to all members
      
      // Separate participants into teams
      const hostTeam = participants.filter(p => p.teamType === 'host');
      const opponentTeam = participants.filter(p => p.teamType === 'opponent');
      
      if (hostTeam.length === 0 || opponentTeam.length === 0) {
        throw new Error('Invalid team configuration: Both teams must have at least one member');
      }
      
      // Calculate team performances
      const hostPerformance = this.calculateTeamPerformance(hostTeam, format);
      const opponentPerformance = this.calculateTeamPerformance(opponentTeam, format);
      
      // Determine team result based on format
      let hostResult = 0.5; // Default to draw
      
      if (format === 'icpc') {
        // ICPC: Lower penalty wins, if tied then more problems solved wins
        if (hostPerformance.penalty < opponentPerformance.penalty) {
          hostResult = 1; // Host wins
        } else if (hostPerformance.penalty > opponentPerformance.penalty) {
          hostResult = 0; // Host loses
        } else {
          // Tied penalty, check problems solved
          if (hostPerformance.problemsSolved > opponentPerformance.problemsSolved) {
            hostResult = 1;
          } else if (hostPerformance.problemsSolved < opponentPerformance.problemsSolved) {
            hostResult = 0;
          }
          // Otherwise it's a draw (0.5)
        }
      } else if (format === 'ioi' || format === 'long') {
        // IOI/LONG: Higher score wins
        if (hostPerformance.score > opponentPerformance.score) {
          hostResult = 1; // Host wins
        } else if (hostPerformance.score < opponentPerformance.score) {
          hostResult = 0; // Host loses
        }
        // Otherwise it's a draw (0.5)
      }
      
      const opponentResult = 1 - hostResult;
      
      // Calculate rating changes for each team member
      const teamResults = [];
      
      // Host team members
      hostTeam.forEach(member => {
        const ratingChange = this.calculateNewRating(
          member.currentRating,
          opponentPerformance.avgRating,
          hostResult,
          member.cfRating,
          format,
          { submissions: member.submissions },
          { submissions: [] } // Team performance already calculated
        );
        
        teamResults.push({
          playerId: member.userId,
          teamType: 'host',
          teamResult: hostResult,
          ...ratingChange
        });
      });
      
      // Opponent team members
      opponentTeam.forEach(member => {
        const ratingChange = this.calculateNewRating(
          member.currentRating,
          hostPerformance.avgRating,
          opponentResult,
          member.cfRating,
          format,
          { submissions: member.submissions },
          { submissions: [] } // Team performance already calculated
        );
        
        teamResults.push({
          playerId: member.userId,
          teamType: 'opponent',
          teamResult: opponentResult,
          ...ratingChange
        });
      });
      
      return teamResults;
    }
    
    throw new Error(`Unsupported room mode: ${roomMode}`);
  }
}

module.exports = new RatingCalculator();