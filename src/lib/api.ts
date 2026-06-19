import type {
  Member,
  Technician,
  ServiceItem,
  Appointment,
  RechargeRule,
  TechnicianReport,
  ServiceReport,
  RechargeReport,
  TransactionDetail,
  BirthdayRecord,
  TechnicianDetailReport,
  ServiceDetailReport,
  DashboardSummary,
  CreateMemberRequest,
  RechargeMemberRequest,
  ConsumeMemberRequest,
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  CreateRechargeRuleRequest,
  CreateServiceRequest,
  MemberRechargeRecord,
  MemberConsumeRecord,
} from "../../shared/types";

export type Service = ServiceItem;

const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const result = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result.data;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return undefined as T;
}

export async function getMembers(): Promise<Member[]> {
  return request<Member[]>("/members");
}

export async function getMember(id: number): Promise<Member> {
  return request<Member>(`/members/${id}`);
}

export async function createMember(data: CreateMemberRequest): Promise<Member> {
  return request<Member>("/members", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMember(id: number, data: Partial<Member>): Promise<Member> {
  return request<Member>(`/members/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function rechargeMember(
  memberId: number,
  data: RechargeMemberRequest
): Promise<MemberRechargeRecord> {
  return request<MemberRechargeRecord>(`/members/${memberId}/recharge`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function consumeMember(
  memberId: number,
  data: ConsumeMemberRequest
): Promise<MemberConsumeRecord> {
  return request<MemberConsumeRecord>(`/members/${memberId}/consume`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBirthdayMembers(): Promise<Member[]> {
  return request<Member[]>("/members/birthdays");
}

export async function handleBirthday(memberId: number, note?: string): Promise<void> {
  return request<void>(`/members/${memberId}/birthday-handle`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function getTechnicians(): Promise<Technician[]> {
  return request<Technician[]>("/technicians");
}

export async function getAvailableTechnicians(
  date: string,
  time: string,
  duration: number
): Promise<Technician[]> {
  const params = new URLSearchParams({ date, time, duration: String(duration) });
  return request<Technician[]>(`/technicians/available?${params.toString()}`);
}

export async function createTechnician(data: Partial<Technician>): Promise<Technician> {
  return request<Technician>("/technicians", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getServices(): Promise<Service[]> {
  return request<Service[]>("/services");
}

export async function createService(data: CreateServiceRequest): Promise<Service> {
  return request<Service>("/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAppointments(date?: string): Promise<Appointment[]> {
  const query = date ? `?date=${date}` : "";
  return request<Appointment[]>(`/appointments${query}`);
}

export async function createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
  return request<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAppointmentStatus(
  appointmentId: number,
  data: UpdateAppointmentStatusRequest
): Promise<Appointment> {
  return request<Appointment>(`/appointments/${appointmentId}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getRechargeRules(): Promise<RechargeRule[]> {
  return request<RechargeRule[]>("/rules/recharge");
}

export async function createRechargeRule(data: CreateRechargeRuleRequest): Promise<RechargeRule> {
  return request<RechargeRule>("/rules/recharge", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteRechargeRule(id: number): Promise<{ id: number }> {
  return request<{ id: number }>(`/rules/recharge/${id}`, {
    method: "DELETE",
  });
}

export async function getTechnicianReports(month: string): Promise<TechnicianReport[]> {
  return request<TechnicianReport[]>(`/reports/technicians?month=${month}`);
}

export async function getServiceReports(month: string): Promise<ServiceReport[]> {
  return request<ServiceReport[]>(`/reports/services?month=${month}`);
}

export async function getRechargeReports(month: string): Promise<RechargeReport> {
  return request<RechargeReport>(`/reports/recharge?month=${month}`);
}

export async function getMemberTransactions(id: number): Promise<TransactionDetail[]> {
  return request<TransactionDetail[]>(`/members/${id}/transactions`);
}

export async function getMemberBirthdayRecords(id: number): Promise<BirthdayRecord[]> {
  return request<BirthdayRecord[]>(`/members/${id}/birthday-records`);
}

export async function getTechnicianDetail(month: string, technicianId: number): Promise<TechnicianDetailReport> {
  return request<TechnicianDetailReport>(`/reports/technician-detail?month=${month}&technicianId=${technicianId}`);
}

export async function getServiceDetail(month: string, serviceId: number): Promise<ServiceDetailReport> {
  return request<ServiceDetailReport>(`/reports/service-detail?month=${month}&serviceId=${serviceId}`);
}

export async function getDashboardSummary(month?: string): Promise<DashboardSummary> {
  const query = month ? `?month=${month}` : "";
  return request<DashboardSummary>(`/reports/dashboard-summary${query}`);
}
