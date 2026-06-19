export interface Member {
  id: number;
  name: string;
  phone: string;
  birthday: string | null;
  balance: number;
  points: number;
  hairPreference: string | null;
  noShowCount: number;
  createdAt: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  specialties: string;
  avatar: string | null;
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number;
  duration: number;
}

export type Service = ServiceItem;

export type AppointmentStatus = 'pending' | 'completed' | 'no_show' | 'cancelled';

export interface Appointment {
  id: number;
  memberId: number | null;
  technicianId: number;
  serviceId: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  memberName?: string | null;
  technicianName?: string | null;
  serviceName?: string | null;
}

export type TransactionType = 'consume' | 'recharge';

export interface Transaction {
  id: number;
  memberId: number;
  technicianId: number;
  serviceId: number;
  amount: number;
  bonusAmount: number;
  pointsEarned: number;
  type: TransactionType;
  createdAt: string;
}

export interface RechargeRule {
  id: number;
  rechargeAmount: number;
  bonusAmount: number;
}

export type BirthdayMember = Member & {
  daysUntilBirthday?: number;
};

export interface MemberRechargeRecord {
  member: Member;
  rechargeAmount: number;
  bonusAmount: number;
  transactionId: number;
}

export interface MemberConsumeRecord {
  member: Member;
  pointsEarned: number;
  transactionId: number;
}

export interface TechnicianReport {
  id: number;
  name: string;
  appointmentCount: number;
  revenue: number;
}

export interface ServiceReport {
  id: number;
  name: string;
  appointmentCount: number;
  revenue: number;
}

export interface RechargeReport {
  rechargeCount: number;
  totalRecharge: number;
  totalBonus: number;
  rules: RechargeRule[];
}

export interface CreateMemberRequest {
  name: string;
  phone: string;
  birthday?: string | null;
  hairPreference?: string | null;
}

export interface RechargeMemberRequest {
  amount: number;
  bonusAmount?: number;
}

export interface BirthdayRecord {
  id: number;
  memberId: number;
  year: number;
  handledAt: string;
  note: string | null;
}

export interface HandleBirthdayRequest {
  note?: string;
}

export interface ConsumeMemberRequest {
  amount: number;
  technicianId?: number;
  serviceId?: number;
}

export interface CreateAppointmentRequest {
  memberId?: number | null;
  technicianId: number;
  serviceId: number;
  date: string;
  time: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
}

export interface CreateRechargeRuleRequest {
  rechargeAmount: number;
  bonusAmount: number;
}

export interface TransactionDetail {
  id: number;
  amount: number;
  bonusAmount?: number;
  pointsEarned?: number;
  type?: TransactionType;
  createdAt: string;
  memberName?: string | null;
  serviceName?: string | null;
  technicianName?: string | null;
}

export interface TechnicianDetailReport {
  id: number;
  name: string;
  transactions: TransactionDetail[];
}

export interface ServiceDetailReport {
  id: number;
  name: string;
  transactions: TransactionDetail[];
}

export interface DashboardSummary {
  monthlyRevenue: number;
  monthlyRecharge: number;
}

export interface CreateServiceRequest {
  name: string;
  price: number;
  duration: number;
}
