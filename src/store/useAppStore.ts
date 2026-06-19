import { create } from "zustand";
import type {
  Member,
  Technician,
  ServiceItem,
  Appointment,
  RechargeRule,
  CreateMemberRequest,
  RechargeMemberRequest,
  ConsumeMemberRequest,
  CreateAppointmentRequest,
  AppointmentStatus,
  CreateRechargeRuleRequest,
  CreateServiceRequest,
} from "../../shared/types";
import * as api from "@/lib/api";

type AppState = {
  members: Member[];
  technicians: Technician[];
  services: ServiceItem[];
  appointments: Appointment[];
  rechargeRules: RechargeRule[];
  loading: boolean;
  error: string | null;

  loadMembers: () => Promise<void>;
  addMember: (data: CreateMemberRequest) => Promise<Member>;
  rechargeMemberStore: (memberId: number, data: RechargeMemberRequest) => Promise<void>;
  consumeMemberStore: (memberId: number, data: ConsumeMemberRequest) => Promise<void>;
  loadBirthdayMembers: () => Promise<Member[]>;
  handleBirthday: (memberId: number, note?: string) => Promise<void>;

  loadTechnicians: () => Promise<void>;
  addTechnician: (data: Partial<Technician>) => Promise<Technician>;
  loadAvailableTechnicians: (
    date: string,
    time: string,
    duration: number
  ) => Promise<Technician[]>;

  loadServices: () => Promise<void>;
  addService: (data: CreateServiceRequest) => Promise<ServiceItem>;

  loadAppointments: (date?: string) => Promise<void>;
  addAppointment: (data: CreateAppointmentRequest) => Promise<Appointment>;
  updateAppointmentStatusStore: (
    appointmentId: number,
    status: AppointmentStatus
  ) => Promise<void>;

  loadRechargeRules: () => Promise<void>;
  addRechargeRule: (data: CreateRechargeRuleRequest) => Promise<RechargeRule>;
  removeRechargeRule: (id: number) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  members: [],
  technicians: [],
  services: [],
  appointments: [],
  rechargeRules: [],
  loading: false,
  error: null,

  loadMembers: async () => {
    set({ loading: true, error: null });
    try {
      const members = await api.getMembers();
      set({ members });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addMember: async (data) => {
    set({ loading: true, error: null });
    try {
      const member = await api.createMember(data);
      set((state) => ({ members: [...state.members, member] }));
      return member;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  rechargeMemberStore: async (memberId, data) => {
    set({ loading: true, error: null });
    try {
      await api.rechargeMember(memberId, data);
      await get().loadMembers();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  consumeMemberStore: async (memberId, data) => {
    set({ loading: true, error: null });
    try {
      await api.consumeMember(memberId, data);
      await get().loadMembers();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadBirthdayMembers: async () => {
    set({ loading: true, error: null });
    try {
      return await api.getBirthdayMembers();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  handleBirthday: async (memberId, note) => {
    set({ loading: true, error: null });
    try {
      await api.handleBirthday(memberId, note);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadTechnicians: async () => {
    set({ loading: true, error: null });
    try {
      const technicians = await api.getTechnicians();
      set({ technicians });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addTechnician: async (data) => {
    set({ loading: true, error: null });
    try {
      const technician = await api.createTechnician(data);
      set((state) => ({ technicians: [...state.technicians, technician] }));
      return technician;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadAvailableTechnicians: async (date, time, duration) => {
    set({ loading: true, error: null });
    try {
      return await api.getAvailableTechnicians(date, time, duration);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadServices: async () => {
    set({ loading: true, error: null });
    try {
      const services = await api.getServices();
      set({ services });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addService: async (data) => {
    set({ loading: true, error: null });
    try {
      const service = await api.createService(data);
      set((state) => ({ services: [...state.services, service] }));
      return service;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadAppointments: async (date) => {
    set({ loading: true, error: null });
    try {
      const appointments = await api.getAppointments(date);
      set({ appointments });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addAppointment: async (data) => {
    set({ loading: true, error: null });
    try {
      const appointment = await api.createAppointment(data);
      set((state) => ({ appointments: [...state.appointments, appointment] }));
      return appointment;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateAppointmentStatusStore: async (appointmentId, status) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.updateAppointmentStatus(appointmentId, { status });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === appointmentId ? updated : a
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadRechargeRules: async () => {
    set({ loading: true, error: null });
    try {
      const rechargeRules = await api.getRechargeRules();
      set({ rechargeRules });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addRechargeRule: async (data) => {
    set({ loading: true, error: null });
    try {
      const rule = await api.createRechargeRule(data);
      set((state) => ({ rechargeRules: [...state.rechargeRules, rule] }));
      return rule;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeRechargeRule: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteRechargeRule(id);
      set((state) => ({
        rechargeRules: state.rechargeRules.filter((r) => r.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
