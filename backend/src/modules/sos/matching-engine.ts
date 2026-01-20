/**
 * Matching Engine
 * 
 * Finds and notifies nearby volunteers for SOS requests.
 * Uses progressive radius search: 1km -> 3km -> 5km -> 10km
 */

import { query } from '../../config/database.js';
import config from '../../config/env.js';
import logger from '../../config/logger.js';
import { SOS_PRIORITY } from '../../shared/constants.js';
import { EmergencyType, SOSPriority } from '../../shared/types.js';

interface VolunteerMatch {
    userId: string;
    name: string;
    phone: string;
    email: string;
    skills: string[];
    rating: number;
    distance: number;
}

class MatchingEngine {
    /**
     * Find nearby volunteers for SOS
     * Uses progressive radius search
     */
    async findVolunteers(sosId: string, latitude: number, longitude: number, emergencyType: EmergencyType) {
        try {
            const radiusSteps: number[] = config.geo.searchRadiusSteps;
            const maxVolunteers: number = config.geo.maxVolunteersToNotify;

            let volunteers: VolunteerMatch[] = [];

            // Progressive radius search
            for (const radius of radiusSteps) {
                logger.info('Searching for volunteers', { sosId, radius });

                volunteers = await this.searchVolunteersInRadius(
                    latitude,
                    longitude,
                    radius,
                    emergencyType,
                    maxVolunteers
                );

                if (volunteers.length > 0) {
                    logger.info('Volunteers found', {
                        sosId,
                        radius,
                        count: volunteers.length
                    });
                    break;
                }
            }

            if (volunteers.length === 0) {
                logger.warn('No volunteers found', { sosId });
                return [];
            }

            // Filter out volunteers who already rejected this SOS
            const availableVolunteers = await this.filterRejectedVolunteers(sosId, volunteers);

            return availableVolunteers;
        } catch (error: any) {
            logger.error('Matching engine error', {
                error: error.message,
                sosId
            });
            throw error;
        }
    }

    /**
     * Search for volunteers within radius
     */
    async searchVolunteersInRadius(latitude: number, longitude: number, radius: number, emergencyType: EmergencyType, limit: number): Promise<VolunteerMatch[]> {
        try {
            // Note: emergencyParams is unused but kept for interface consistency or future use
            const result = await query(
                `SELECT v.user_id, u.email,
                p.name, p.phone,
                v.skills, v.average_rating,
                ST_Distance(
                  l.location,
                  ST_SetSRID(ST_MakePoint($2, $1), 4326)
                ) as distance
         FROM volunteers v
         JOIN users u ON v.user_id = u.id
         JOIN user_profiles p ON v.user_id = p.user_id
         JOIN user_locations l ON v.user_id = l.user_id
         WHERE v.verified = true
           AND v.available = true
           AND u.is_active = true
           AND ST_DWithin(
             l.location,
             ST_SetSRID(ST_MakePoint($2, $1), 4326),
             $3
           )
         ORDER BY 
           v.average_rating DESC,
           distance ASC
         LIMIT $4`,
                [latitude, longitude, radius, limit]
            );

            return result.rows.map(row => ({
                userId: row.user_id,
                name: row.name,
                phone: row.phone,
                email: row.email,
                skills: row.skills,
                rating: parseFloat(row.average_rating) || 0,
                distance: Math.round(row.distance)
            }));
        } catch (error: any) {
            logger.error('Search volunteers error', { error: error.message });
            throw error;
        }
    }

    /**
     * Filter out volunteers who already rejected this SOS
     */
    async filterRejectedVolunteers(sosId: string, volunteers: VolunteerMatch[]): Promise<VolunteerMatch[]> {
        try {
            const volunteerIds = volunteers.map(v => v.userId);

            if (volunteerIds.length === 0) {
                return [];
            }

            const result = await query(
                `SELECT volunteer_id
         FROM sos_rejections
         WHERE sos_id = $1 AND volunteer_id = ANY($2)`,
                [sosId, volunteerIds]
            );

            const rejectedIds = new Set(result.rows.map(r => r.volunteer_id));

            return volunteers.filter(v => !rejectedIds.has(v.userId));
        } catch (error: any) {
            logger.error('Filter rejected volunteers error', { error: error.message });
            return volunteers; // Return all if filter fails
        }
    }

    /**
     * Calculate SOS priority based on emergency type
     */
    calculatePriority(emergencyType: EmergencyType): SOSPriority {
        const priorityMap: Record<string, SOSPriority> = {
            'MEDICAL': SOS_PRIORITY.CRITICAL,
            'FIRE': SOS_PRIORITY.CRITICAL,
            'ACCIDENT': SOS_PRIORITY.HIGH,
            'CRIME': SOS_PRIORITY.HIGH,
            'NATURAL_DISASTER': SOS_PRIORITY.CRITICAL,
            'OTHER': SOS_PRIORITY.MEDIUM
        };

        return priorityMap[emergencyType] || SOS_PRIORITY.MEDIUM;
    }
}

export default new MatchingEngine();
