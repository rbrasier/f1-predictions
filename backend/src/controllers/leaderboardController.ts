import { Response } from 'express';
import ExcelJS from 'exceljs';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';

export const getLeaderboard = (req: AuthRequest, res: Response) => {
  try {
    const seasonId = req.query.seasonId;

    // Get all users with their total points
    const query = `
      SELECT
        u.id as user_id,
        u.display_name,
        COALESCE(sp.points_earned, 0) as season_points,
        COALESCE(SUM(rp.points_earned), 0) as race_points,
        COALESCE(sp.points_earned, 0) + COALESCE(SUM(rp.points_earned), 0) as total_points
      FROM users u
      LEFT JOIN season_predictions sp ON u.id = sp.user_id ${seasonId ? 'AND sp.season_id = ?' : ''}
      LEFT JOIN race_predictions rp ON u.id = rp.user_id
      LEFT JOIN races r ON rp.race_id = r.id ${seasonId ? 'AND r.season_id = ?' : ''}
      WHERE u.is_admin = 0
      GROUP BY u.id, u.display_name, sp.points_earned
      ORDER BY total_points DESC, u.display_name
    `;

    const params = seasonId ? [seasonId, seasonId] : [];
    const leaderboard = db.prepare(query).all(...params);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry: any, index: number) => ({
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
    const seasonId = req.query.seasonId;

    // Get season prediction
    const seasonPredictionParams = seasonId ? [userId, seasonId] : [userId];
    const seasonPrediction = db.prepare(`
      SELECT sp.*, s.year
      FROM season_predictions sp
      JOIN seasons s ON sp.season_id = s.id
      WHERE sp.user_id = ? ${seasonId ? 'AND sp.season_id = ?' : ''}
    `).get(...seasonPredictionParams);

    // Get race predictions
    const racePredictionParams = seasonId ? [userId, seasonId] : [userId];
    const racePredictions = db.prepare(`
      SELECT rp.*, r.name, r.round_number, r.race_date
      FROM race_predictions rp
      JOIN races r ON rp.race_id = r.id
      WHERE rp.user_id = ? ${seasonId ? 'AND r.season_id = ?' : ''}
      ORDER BY r.round_number
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
    const seasonId = req.query.seasonId as string | undefined;

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
      LEFT JOIN season_predictions sp ON u.id = sp.user_id ${seasonId ? 'AND sp.season_id = ?' : ''}
      LEFT JOIN race_predictions rp ON u.id = rp.user_id
      LEFT JOIN races r ON rp.race_id = r.id ${seasonId ? 'AND r.season_id = ?' : ''}
      WHERE u.is_admin = 0
      GROUP BY u.id, u.display_name, sp.points_earned
      ORDER BY total_points DESC, u.display_name
    `;

    const params = seasonId ? [seasonId, seasonId] : [];
    const leaderboard = db.prepare(leaderboardQuery).all(...params) as any[];

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

    const seasonPredictions = db.prepare(`
      SELECT sp.*, u.display_name
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      ${seasonId ? 'WHERE sp.season_id = ?' : ''}
      ORDER BY u.display_name
    `).all(...(seasonId ? [seasonId] : [])) as any[];

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
    const races = db.prepare(`
      SELECT id, name, round_number
      FROM races
      ${seasonId ? 'WHERE season_id = ?' : ''}
      ORDER BY round_number
    `).all(...(seasonId ? [seasonId] : [])) as any[];

    for (const race of races) {
      const raceSheet = workbook.addWorksheet(`R${race.round_number}: ${race.name.substring(0, 20)}`);
      raceSheet.columns = [
        { header: 'Player', key: 'display_name', width: 25 },
        { header: 'Pole', key: 'pole', width: 20 },
        { header: 'Podium', key: 'podium', width: 40 },
        { header: 'Midfield Hero', key: 'midfield', width: 20 },
        { header: 'Crazy Prediction', key: 'crazy', width: 50 },
        { header: 'Points', key: 'points', width: 10 }
      ];

      const predictions = db.prepare(`
        SELECT rp.*, u.display_name
        FROM race_predictions rp
        JOIN users u ON rp.user_id = u.id
        WHERE rp.race_id = ?
        ORDER BY u.display_name
      `).all(race.id) as any[];

      predictions.forEach(pred => {
        raceSheet.addRow({
          display_name: pred.display_name,
          pole: pred.pole_position_driver_id,
          podium: `${pred.podium_first_driver_id}, ${pred.podium_second_driver_id}, ${pred.podium_third_driver_id}`,
          midfield: pred.midfield_hero_driver_id,
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
