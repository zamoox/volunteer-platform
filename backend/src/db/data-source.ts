import { DataSource } from 'typeorm';
import { config } from 'dotenv';
// Імпортуємо всі твої сутності (додай інші, якщо є)
import { User } from 'src/users/user.entity';
import { VolunteerRequest } from 'src/requests/request.entity';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';
import { VolunteerProfile } from 'src/volunteers/volunteer-profile.entity';
import { Review } from 'src/reviews/review.entity'; 

config(); // завантажує змінні з .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'volunteer_db',
  entities: [User, VolunteerRequest, OrganizationProfile, VolunteerProfile, Review],
  migrations: ['src/db/migrations/*.ts'],
  synchronize: false, 
});