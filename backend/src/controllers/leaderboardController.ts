import { Response } from 'express';
import ExcelJS from 'exceljs';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    // Get all users with their total points
    let query = `
      SELECT
        u.id as user_id,
        u.display_name,
        COALESCE(sp.points_earned, 0) as season_points,
        COALESCE(SUM(rp.points_earned), 0) as race_points,
        COALESCE(sp.points_earned, 0) + COALESCE(SUM(rp.points_earned), 0) as total_points
      FROM users u
      LEFT JOIN season_predictions sp ON u.id = sp.user_id ${seasonYear ? 'AND sp.season_year = ?' : ''}
      LEFT JOIN race_predictions rp ON u.id = rp.user_id ${seasonYear ? 'AND rp.season_year = ?' : ''}
      WHERE u.is_admin = 0
      GROUP BY u.id, u.display_name, sp.points_earned
      ORDER BY total_points DESC, u.display_name
    `;

    if (limit && limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    const params = seasonYear ? [seasonYear, seasonYear] : [];
    const leaderboard = db.prepare(query).all(...params);

    // Add rank
    const rankedLeaderboard = (await leaderboard).map((entry: any, index: number) => ({
      rank: index + 1,
      ...entry
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserBreakdown = (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;

    // Get season prediction
    const seasonPredictionParams = seasonYear ? [userId, seasonYear] : [userId];
    const seasonPrediction = db.prepare(`
      SELECT sp.*
      FROM season_predictions sp
      WHERE sp.user_id = ? ${seasonYear ? 'AND sp.season_year = ?' : ''}
    `).get(...seasonPredictionParams);

    // Get race predictions
    const racePredictionParams = seasonYear ? [userId, seasonYear] : [userId];
    const racePredictions = db.prepare(`
      SELECT rp.*
      FROM race_predictions rp
      WHERE rp.user_id = ? ${seasonYear ? 'AND rp.season_year = ?' : ''}
      ORDER BY rp.round_number
    `).all(...racePredictionParams);

    res.json({
      season_prediction: seasonPrediction,
      race_predictions: racePredictions
    });
  } catch (error) {
    console.error('Get user breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportToExcel = async (req: AuthRequest, res: Response) => {
  try {
    const seasonYear = req.query.seasonYear ? parseInt(req.query.seasonYear as string) : undefined;

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
        COALESCE(sp.points_earned, 0) as season_points,
        COALESCE(SUM(rp.points_earned), 0) as race_points,
        COALESCE(sp.points_earned, 0) + COALESCE(SUM(rp.points_earned), 0) as total_points
      FROM users u
      LEFT JOIN season_predictions sp ON u.id = sp.user_id ${seasonYear ? 'AND sp.season_year = ?' : ''}
      LEFT JOIN race_predictions rp ON u.id = rp.user_id ${seasonYear ? 'AND rp.season_year = ?' : ''}
      WHERE u.is_admin = 0
      GROUP BY u.id, u.display_name, sp.points_earned
      ORDER BY total_points DESC, u.display_name
    `;

    const params = seasonYear ? [seasonYear, seasonYear] : [];
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

    const seasonPredictions = await db.prepare(`
      SELECT sp.*, u.display_name
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      ${seasonYear ? 'WHERE sp.season_year = ?' : ''}
      ORDER BY u.display_name
    `).all(...(seasonYear ? [seasonYear] : [])) as any[];

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
    const raceRounds = await db.prepare(`
      SELECT DISTINCT season_year, round_number
      FROM race_predictions
      ${seasonYear ? 'WHERE season_year = ?' : ''}
      ORDER BY season_year, round_number
    `).all(...(seasonYear ? [seasonYear] : [])) as any[];

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

      const predictions = await db.prepare(`
        SELECT rp.*, u.display_name
        FROM race_predictions rp
        JOIN users u ON rp.user_id = u.id
        WHERE rp.season_year = ? AND rp.round_number = ?
        ORDER BY u.display_name
      `).all(raceRound.season_year, raceRound.round_number) as any[];

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
    console.error('Export to Excel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
