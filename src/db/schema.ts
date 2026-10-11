import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 1. Tenant configuration (MS Sports Academy first deployment, fully generic)
export const academies = sqliteTable('academies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('Asia/Kolkata'),
  currency: text('currency').notNull().default('INR'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

// 2. Configurable Sports & Pricing Matrix
export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  name: text('name').notNull(), // e.g. 'Badminton', 'Tennis'
  memberMonthlyAmount: integer('member_monthly_amount').notNull(), // in integer minor units (paise)
  studentMonthlyAmount: integer('student_monthly_amount').notNull(),
  guestVisitAmount: integer('guest_visit_amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

// 3. Members / Students / Guests (Single table, category as field)
export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['member', 'student', 'guest'] }).notNull(),
  batch: text('batch', { enum: ['morning', 'evening', 'both'] }).notNull(),
  contactNumber: text('contact_number'),
  address: text('address'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  // Hand-typed custom monthly fee for multi-game players (never overwritten by settings price changes)
  customMonthlyAmount: integer('custom_monthly_amount'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

// 4. Member to Games Association (Supports multiple sports)
export const memberGames = sqliteTable('member_games', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  memberId: text('member_id').notNull().references(() => members.id),
  gameId: text('game_id').notNull().references(() => games.id),
}, (t) => [
  uniqueIndex('member_games_unique_idx').on(t.academyId, t.memberId, t.gameId),
])

// 5. Member Status History Audit Log (Tracks active/inactive lifecycle)
export const memberStatusLogs = sqliteTable('member_status_logs', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  memberId: text('member_id').notNull().references(() => members.id),
  status: text('status', { enum: ['active', 'inactive'] }).notNull(),
  reason: text('reason'), // e.g. "Left without notice", "Rejoined"
  changedAt: integer('changed_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

// 6. Attendance Marks (Date & batch stored directly, no separate sessions table)
export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  date: text('date').notNull(), // Local date 'YYYY-MM-DD' in academy timezone
  batch: text('batch', { enum: ['morning', 'evening'] }).notNull(),
  memberId: text('member_id').notNull().references(() => members.id),
  status: text('status', { enum: ['present', 'absent'] }).notNull(),
  markedAt: integer('marked_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => [
  uniqueIndex('attendance_unique_idx').on(t.academyId, t.date, t.batch, t.memberId),
])

// 7. Monthly Subscription Fees (For Members & Regular Students)
export const monthlyFees = sqliteTable('monthly_fees', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  memberId: text('member_id').notNull().references(() => members.id),
  month: text('month').notNull(), // 'YYYY-MM' (e.g. '2026-10')
  amountDue: integer('amount_due').notNull(), // in integer minor units (paise)
  status: text('status', {
    enum: ['standard', 'waived_no_fee', 'switched_to_visits']
  }).notNull().default('standard'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => [
  uniqueIndex('monthly_fees_unique_idx').on(t.academyId, t.memberId, t.month),
])

// 8. On-The-Spot Visit Charges (For Guests & Short-Stay Students)
export const visitCharges = sqliteTable('visit_charges', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  memberId: text('member_id').notNull().references(() => members.id),
  date: text('date').notNull(), // Local date 'YYYY-MM-DD'
  gameId: text('game_id').notNull().references(() => games.id),
  amount: integer('amount').notNull(), // in integer minor units (paise)
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

// 9. Append-Only Payments Log
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  academyId: text('academy_id').notNull().references(() => academies.id),
  memberId: text('member_id').notNull().references(() => members.id),
  amount: integer('amount').notNull(), // Always positive integer minor units (paise)
  paymentMethod: text('payment_method', { enum: ['cash', 'upi', 'other'] }).notNull().default('cash'),
  paidAt: integer('paid_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  notes: text('notes'),
  // Self-reference: points to earlier payment ID if correcting an entry via reversal
  reversalOfId: text('reversal_of_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})
