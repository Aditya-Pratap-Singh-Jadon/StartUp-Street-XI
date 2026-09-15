import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('Connected to MongoDB. Starting database seed...');

    // Clear existing data
    await prisma.$transaction([
      prisma.announcement.deleteMany({}),
      prisma.eventConfig.deleteMany({}),
      prisma.fAQ.deleteMany({}),
      prisma.judge.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.profile.deleteMany({}),
      prisma.result.deleteMany({}),
      prisma.submission.deleteMany({}),
      prisma.team.deleteMany({}),
      prisma.teamMember.deleteMany({}),
      prisma.timelineEvent.deleteMany({}),
    ]);
    console.log('Cleared existing collections.');

    // Users
    const defaultPassword = await hashPassword('password123');
    
    const superadmin = await prisma.profile.create({
      data: {
        id: uuidv4(),
        email: 'superadmin@startupstreet.demo',
        password: defaultPassword,
        name: 'Super Admin User',
        role: 'superadmin',
      }
    });

    const admin = await prisma.profile.create({
      data: {
        id: uuidv4(),
        email: 'organizer@startupstreet.demo',
        password: defaultPassword,
        name: 'Organizer Admin',
        role: 'admin',
      }
    });

    const participant1 = await prisma.profile.create({
      data: {
        id: uuidv4(),
        email: 'jadujedan@gmail.com',
        password: defaultPassword,
        name: 'Jadu Jedan',
        phone: '1234567890',
        reg_no: '22BCE0001',
        role: 'participant',
      }
    });

    const participant2 = await prisma.profile.create({
      data: {
        id: uuidv4(),
        email: 'participant@startupstreet.demo',
        password: defaultPassword,
        name: 'Demo Participant',
        phone: '0987654321',
        reg_no: '22BCE0002',
        role: 'participant',
      }
    });
    console.log('Created Users (Passwords are "password123").');

    // Event Config
    await prisma.eventConfig.createMany({
      data: [
        { key: 'team_min', value: '2' },
        { key: 'team_max', value: '5' },
        { key: 'allow_leave', value: 'true' },
        { key: 'submissions_open', value: 'true' },
        { key: 'allow_resubmission', value: 'true' },
        { key: 'registration_open', value: 'true' },
        { key: 'current_stage', value: 'Registration' },
      ]
    });
    console.log('Created Event Config.');

    // Teams
    const team = await prisma.team.create({
      data: {
        name: 'Innovators',
        code: 'SSXI-ABCD',
        leader_id: participant1.id,
      }
    });
    
    await prisma.teamMember.createMany({
      data: [
        { team_id: team.id, user_id: participant1.id },
        { team_id: team.id, user_id: participant2.id }
      ]
    });
    console.log('Created Team: Innovators.');

    // FAQs
    await prisma.fAQ.createMany({
      data: [
        { question: 'What is Startup Street XI?', answer: 'It is a flagship pitching event designed for student entrepreneurs.', category: 'General', sort_order: 1 },
        { question: 'Who can participate?', answer: 'Any university student with a valid ID can form a team and participate.', category: 'Eligibility', sort_order: 2 }
      ]
    });

    // Timeline Events
    await prisma.timelineEvent.createMany({
      data: [
        { title: 'Registration Opens', description: 'Form your teams and register online.', sort_order: 1, is_completed: true },
        { title: 'Idea Submission', description: 'Submit your initial pitch deck.', sort_order: 2, is_completed: false, is_current: true },
        { title: 'Final Pitch', description: 'Top teams pitch in front of the judges.', sort_order: 3, is_completed: false }
      ]
    });
    
    // Judges
    await prisma.judge.createMany({
      data: [
        { name: 'John Doe', designation: 'CEO', organization: 'TechCorp', sort_order: 1 },
        { name: 'Jane Smith', designation: 'Partner', organization: 'VC Partners', sort_order: 2 }
      ]
    });

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
