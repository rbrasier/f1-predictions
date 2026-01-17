import { Response } from 'express';
import ExcelJS from 'exceljs';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;

    // Get all users with their total points
    let query = `
      SELECT
        u.id as user_id,
        u.display_name,
        COALESCE(MAX(sp.points_earned), 0) as season_points,
        COALESCE(SUM(rp.points_earned), 0) as race_points,
        COALESCE(MAX(sp.points_earned), 0) + COALESCE(SUM(rp.points_earned), 0) as total_points
      FROM users u
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
      LEFT JOIN season_predictions sp ON u.id = sp.user_id ${seasonYear ? 'AND sp.season_year = $1' : ''}
      LEFT JOIN race_predictions rp ON u.id = rp.user_id ${seasonYear ? 'AND rp.season_year = $2' : ''}
      WHERE u.is_admin = false ${leagueId ? (seasonYear ? 'AND ul.league_id = $3' : 'AND ul.league_id = $1') : ''}
      GROUP BY u.id, u.display_name
      ORDER BY total_points DESC, u.display_name
    `;

    if (limit && limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    const params: number[] = [];
    if (seasonYear) {
      params.push(seasonYear, seasonYear);
    }
    if (leagueId) {
      params.push(leagueId);
    }

    const leaderboard = await db.prepare(query).all(...params) as any[];

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry: any, index: number) => ({
      rank: index + 1,
      ...entry
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserBreakdown = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;

    // Get season prediction
    const seasonPrediction = await db.prepare(`
      SELECT sp.*
      FROM season_predictions sp
      WHERE sp.user_id = $1 ${seasonYear ? 'AND sp.season_year = $2' : ''}
    `).get(...(seasonYear ? [userId, seasonYear] : [userId]));

    // Get race predictions
    const racePredictions = await db.prepare(`
      SELECT rp.*
      FROM race_predictions rp
      WHERE rp.user_id = $1 ${seasonYear ? 'AND rp.season_year = $2' : ''}
      ORDER BY rp.round_number
    `).all(...(seasonYear ? [userId, seasonYear] : [userId]));

    res.json({
      season_prediction: seasonPrediction,
      race_predictions: racePredictions
    });
  } catch (error) {
    logger.error('Get user breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportToExcel = async (req: AuthRequest, res: Response) => {
  try {
    const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'F1 Tipping Competition';
    workbook.created = new Date();

    // Sheet 1: Leaderboard
    const leaderboardSheet = workbook.addWorksheet('Leaderboard');
    leaderboardSheet.columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Player', key: 'display_name', width: 25 },
      { header: 'Total Points', key: 'total_points', width: 15 },
      { header: 'Season Points', key: 'season_points', width: 15 },
      { header: 'Race Points', key: 'race_points', width: 15 }
    ];

    const leaderboardQuery = `
      SELECT
        u.id as user_id,
        u.display_name,
        COALESCE(MAX(sp.points_earned), 0) as season_points,
        COALESCE(SUM(rp.points_earned), 0) as race_points,
        COALESCE(MAX(sp.points_earned), 0) + COALESCE(SUM(rp.points_earned), 0) as total_points
      FROM users u
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
      LEFT JOIN season_predictions sp ON u.id = sp.user_id ${seasonYear ? 'AND sp.season_year = $1' : ''}
      LEFT JOIN race_predictions rp ON u.id = rp.user_id ${seasonYear ? 'AND rp.season_year = $2' : ''}
      WHERE u.is_admin = false ${leagueId ? (seasonYear ? 'AND ul.league_id = $3' : 'AND ul.league_id = $1') : ''}
      GROUP BY u.id, u.display_name
      ORDER BY total_points DESC, u.display_name
    `;

    const params: number[] = [];
    if (seasonYear) {
      params.push(seasonYear, seasonYear);
    }
    if (leagueId) {
      params.push(leagueId);
    }
    const leaderboard = await db.prepare(leaderboardQuery).all(...params) as any[];

    leaderboard.forEach((entry, index) => {
      leaderboardSheet.addRow({
        rank: index + 1,
        ...entry
      });
    });

    // Style header row
    leaderboardSheet.getRow(1).font = { bold: true };
    leaderboardSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE10600' } // F1 red
    };

    // Sheet 2: Season Predictions
    const seasonSheet = workbook.addWorksheet('Season Predictions');
    seasonSheet.columns = [
      { header: 'Player', key: 'display_name', width: 25 },
      { header: 'Drivers Championship', key: 'drivers_champ', width: 40 },
      { header: 'Constructors Championship', key: 'constructors_champ', width: 40 },
      { header: 'Sackings', key: 'sackings', width: 30 },
      { header: 'Audi vs Cadillac', key: 'audi_cadillac', width: 15 },
      { header: 'Crazy Prediction', key: 'crazy', width: 50 },
      { header: 'Points', key: 'points', width: 10 }
    ];

    // Build season predictions query
    let seasonPredictionsQuery = `
      SELECT sp.*, u.display_name
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
    `;

    const whereConditions: string[] = [];
    const seasonParams: number[] = [];

    if (seasonYear) {
      whereConditions.push('sp.season_year = $1');
      seasonParams.push(seasonYear);
    }

    if (leagueId) {
      whereConditions.push(`ul.league_id = $${seasonParams.length + 1}`);
      seasonParams.push(leagueId);
    }

    if (whereConditions.length > 0) {
      seasonPredictionsQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    seasonPredictionsQuery += ' ORDER BY u.display_name';

    const seasonPredictions = await db.prepare(seasonPredictionsQuery).all(...seasonParams) as any[];

    seasonPredictions.forEach(pred => {
      const driversOrder = JSON.parse(pred.drivers_championship_order);
      const constructorsOrder = JSON.parse(pred.constructors_championship_order);

      seasonSheet.addRow({
        display_name: pred.display_name,
        drivers_champ: `Top 5: ${driversOrder.slice(0, 5).join(', ')}...`,
        constructors_champ: `Top 5: ${constructorsOrder.slice(0, 5).join(', ')}...`,
        sackings: pred.mid_season_sackings ? JSON.parse(pred.mid_season_sackings).join(', ') : 'None',
        audi_cadillac: pred.audi_vs_cadillac,
        crazy: pred.crazy_prediction || '',
        points: pred.points_earned
      });
    });

    seasonSheet.getRow(1).font = { bold: true };
    seasonSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE10600' }
    };

    // Sheet 3+: Race by Race
    // Get unique race rounds from predictions
    let raceRoundsQuery = `
      SELECT DISTINCT rp.season_year, rp.round_number
      FROM race_predictions rp
      ${leagueId ? 'INNER JOIN user_leagues ul ON rp.user_id = ul.user_id' : ''}
    `;

    const raceRoundsConditions: string[] = [];
    const raceRoundsParams: number[] = [];

    if (seasonYear) {
      raceRoundsConditions.push('rp.season_year = $1');
      raceRoundsParams.push(seasonYear);
    }

    if (leagueId) {
      raceRoundsConditions.push(`ul.league_id = $${raceRoundsParams.length + 1}`);
      raceRoundsParams.push(leagueId);
    }

    if (raceRoundsConditions.length > 0) {
      raceRoundsQuery += ' WHERE ' + raceRoundsConditions.join(' AND ');
    }

    raceRoundsQuery += ' ORDER BY rp.season_year, rp.round_number';

    const raceRounds = await db.prepare(raceRoundsQuery).all(...raceRoundsParams) as any[];

    for (const raceRound of raceRounds) {
      const raceSheet = workbook.addWorksheet(`${raceRound.season_year} R${raceRound.round_number}`);
      raceSheet.columns = [
        { header: 'Player', key: 'display_name', width: 25 },
        { header: 'Pole', key: 'pole', width: 20 },
        { header: 'Podium', key: 'podium', width: 40 },
        { header: 'Midfield Hero', key: 'midfield', width: 20 },
        { header: 'Crazy Prediction', key: 'crazy', width: 50 },
        { header: 'Points', key: 'points', width: 10 }
      ];

      // Build race predictions query for this round
      let racePredictionsQuery = `
        SELECT rp.*, u.display_name
        FROM race_predictions rp
        JOIN users u ON rp.user_id = u.id
        ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
        WHERE rp.season_year = $1 AND rp.round_number = $2
      `;

      const racePredParams = [raceRound.season_year, raceRound.round_number];

      if (leagueId) {
        racePredictionsQuery += ' AND ul.league_id = $3';
        racePredParams.push(leagueId);
      }

      racePredictionsQuery += ' ORDER BY u.display_name';

      const predictions = await db.prepare(racePredictionsQuery).all(...racePredParams) as any[];

      predictions.forEach(pred => {
        raceSheet.addRow({
          display_name: pred.display_name,
          pole: pred.pole_position_driver_api_id || '',
          podium: `${pred.podium_first_driver_api_id || ''}, ${pred.podium_second_driver_api_id || ''}, ${pred.podium_third_driver_api_id || ''}`,
          midfield: pred.midfield_hero_driver_api_id || '',
          crazy: pred.crazy_prediction || '',
          points: pred.points_earned
        });
      });

      raceSheet.getRow(1).font = { bold: true };
      raceSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE10600' }
      };
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=f1-tipping-leaderboard-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export to Excel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
