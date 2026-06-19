import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Calendar,
  User,
  Scissors,
  Check,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  XCircle,
  List,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type {
  Appointment,
  AppointmentStatus,
  Technician,
  Member,
  ServiceItem,
} from "../../shared/types";
import { cn } from "@/lib/utils";

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "待确认",
  completed: "已完成",
  no_show: "爽约",
  cancelled: "已取消",
};

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  no_show: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-100 text-neutral-600",
};

const statusBlockColors: Record<AppointmentStatus, string> = {
  completed: "bg-green-200 border-green-400 text-green-900",
  pending: "bg-yellow-200 border-yellow-400 text-yellow-900",
  no_show: "bg-red-200 border-red-400 text-red-900",
  cancelled: "bg-neutral-200 border-neutral-400 text-neutral-600",
};

const TIME_SLOTS: string[] = [];
for (let h = 9; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const SLOT_HEIGHT = 32;

export default function Appointments() {
  const {
    appointments,
    members,
    services,
    technicians,
    loadAppointments,
    loadMembers,
    loadServices,
    loadTechnicians,
    loadAvailableTechnicians,
    addAppointment,
    updateAppointmentStatusStore,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    memberId: 0,
    serviceId: 0,
    technicianId: 0,
  });
  const [availableTechs, setAvailableTechs] = useState<Technician[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);

  useEffect(() => {
    loadAppointments(selectedDate);
    loadMembers();
    loadServices();
    loadTechnicians();
  }, [selectedDate, loadAppointments, loadMembers, loadServices, loadTechnicians]);

  const filteredAppointments = appointments
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const openModal = () => {
    setStep(1);
    setConflictError("");
    setFormData({
      date: selectedDate,
      time: "09:00",
      memberId: 0,
      serviceId: 0,
      technicianId: 0,
    });
    setIsModalOpen(true);
  };

  const nextStep = async () => {
    if (step === 1 && formData.date && formData.time) {
      setStep(2);
    } else if (step === 2 && formData.memberId) {
      setStep(3);
    } else if (step === 3 && formData.serviceId) {
      setLoadingTechs(true);
      try {
        const selectedService = services.find(
          (s: ServiceItem) => s.id === formData.serviceId
        );
        const duration = selectedService?.duration || 60;
        const techs = await loadAvailableTechnicians(
          formData.date,
          formData.time,
          duration
        );
        setAvailableTechs(techs || []);
      } catch {
        setAvailableTechs([]);
      } finally {
        setLoadingTechs(false);
      }
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setConflictError("");
    try {
      await addAppointment({
        memberId: formData.memberId || null,
        technicianId: formData.technicianId,
        serviceId: formData.serviceId,
        date: formData.date,
        time: formData.time,
      });
      await loadAppointments(selectedDate);
      setIsModalOpen(false);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("409") || msg.includes("冲突")) {
        setConflictError("该时段与已有预约冲突，请选择其他时间");
      } else {
        alert("创建预约失败");
      }
    }
  };

  const handleStatusUpdate = async (id: number, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatusStore(id, status);
    } catch {
      alert("更新状态失败");
    }
  };

  const scheduleTechnicians = useMemo(() => {
    const techIds = new Set(filteredAppointments.map((a) => a.technicianId));
    return technicians.filter((t) => techIds.has(t.id));
  }, [filteredAppointments, technicians]);

  const getAppointmentBlock = (appointment: Appointment, techIndex: number) => {
    const service = services.find((s: ServiceItem) => s.id === appointment.serviceId);
    const duration = service?.duration || 60;
    const startMin = timeToMinutes(appointment.time);
    const startSlotMin = timeToMinutes("09:00");
    const topOffset = ((startMin - startSlotMin) / 30) * SLOT_HEIGHT;
    const height = (duration / 30) * SLOT_HEIGHT;

    return { topOffset, height, techIndex, duration };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-700" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-lg font-semibold text-neutral-800 bg-transparent border-none focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-accent-700 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <List className="w-4 h-4" />
              列表
            </button>
            <button
              onClick={() => setViewMode("schedule")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "schedule"
                  ? "bg-accent-700 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Clock className="w-4 h-4" />
              时间表
            </button>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-700 text-white rounded-lg shadow-md hover:bg-accent-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建预约
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          {filteredAppointments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-12">
              该日期暂无预约
            </p>
          ) : (
            <div className="space-y-1">
              {filteredAppointments.map((appointment) => {
                const member = members.find(
                  (m: Member) => m.id === appointment.memberId
                );
                const isHighRisk = member && member.noShowCount >= 2;

                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0",
                      isHighRisk && appointment.status === "pending"
                        ? "bg-red-50/50"
                        : ""
                    )}
                  >
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className="text-lg font-bold text-accent-700">
                        {appointment.time}
                      </div>
                      <div className="w-0.5 h-full bg-neutral-200 mt-2" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-800">
                          {appointment.memberName}
                        </span>
                        {isHighRisk && (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            连续爽约{member.noShowCount}次
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            statusStyles[appointment.status]
                          )}
                        >
                          {statusLabels[appointment.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {appointment.technicianName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="w-4 h-4" />
                          {appointment.serviceName}
                        </span>
                      </div>

                      {appointment.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "completed")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            完成
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "no_show")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            爽约
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "cancelled")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            取消
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-12">
              该日期暂无预约
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex min-w-max">
                <div className="flex-shrink-0 w-16 border-r border-neutral-200">
                  <div className="h-12 border-b border-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-500">
                    时间
                  </div>
                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={slot}
                      className="border-b border-neutral-100 flex items-start justify-end pr-2 text-xs text-neutral-500"
                      style={{ height: `${SLOT_HEIGHT}px` }}
                    >
                      <span className="-mt-2">{slot}</span>
                    </div>
                  ))}
                </div>

                {scheduleTechnicians.map((tech) => {
                  const techAppointments = filteredAppointments.filter(
                    (a) => a.technicianId === tech.id
                  );

                  return (
                    <div
                      key={tech.id}
                      className="flex-1 min-w-[140px] border-r border-neutral-200 last:border-r-0"
                    >
                      <div className="h-12 border-b border-neutral-200 flex items-center justify-center text-sm font-medium text-neutral-700">
                        {tech.name}
                      </div>
                      <div className="relative">
                        {TIME_SLOTS.map((slot) => (
                          <div
                            key={slot}
                            className="border-b border-neutral-100"
                            style={{ height: `${SLOT_HEIGHT}px` }}
                          />
                        ))}
                        {techAppointments.map((appointment) => {
                          const block = getAppointmentBlock(appointment, 0);
                          return (
                            <div
                              key={appointment.id}
                              className={cn(
                                "absolute left-1 right-1 rounded-md border px-1.5 py-0.5 overflow-hidden cursor-default text-xs",
                                statusBlockColors[appointment.status]
                              )}
                              style={{
                                top: `${block.topOffset}px`,
                                height: `${Math.max(block.height - 2, 20)}px`,
                              }}
                            >
                              <div className="font-medium truncate">
                                {appointment.memberName}
                              </div>
                              <div className="truncate opacity-75">
                                {appointment.serviceName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">
                新建预约 - 步骤 {step}/4
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {conflictError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {conflictError}
                </div>
              )}

              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      选择日期
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      选择时间
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          time: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    选择客户
                  </label>
                  <select
                    value={formData.memberId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        memberId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  >
                    <option value={0}>请选择客户</option>
                    {members.map((m: Member) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    选择服务项目
                  </label>
                  <div className="space-y-2">
                    {services.map((s: ServiceItem) => (
                      <label
                        key={s.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                          formData.serviceId === s.id
                            ? "border-accent-500 bg-accent-50"
                            : "border-neutral-200 hover:bg-neutral-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="service"
                            value={s.id}
                            checked={formData.serviceId === s.id}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                serviceId: s.id,
                              })
                            }
                            className="text-accent-600"
                          />
                          <span className="font-medium text-neutral-800">
                            {s.name}
                          </span>
                          <span className="text-sm text-neutral-500">
                            ({s.duration}分钟)
                          </span>
                        </div>
                        <span className="font-semibold text-accent-700">
                          ¥{s.price}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    选择空闲技师
                  </label>
                  {loadingTechs ? (
                    <p className="text-center py-4 text-neutral-500">
                      正在查询空闲技师...
                    </p>
                  ) : availableTechs.length === 0 ? (
                    <p className="text-center py-4 text-neutral-500">
                      该时段暂无空闲技师
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableTechs.map((t: Technician) => (
                        <label
                          key={t.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            formData.technicianId === t.id
                              ? "border-accent-500 bg-accent-50"
                              : "border-neutral-200 hover:bg-neutral-50"
                          )}
                        >
                          <input
                            type="radio"
                            name="technician"
                            value={t.id}
                            checked={formData.technicianId === t.id}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                technicianId: t.id,
                              })
                            }
                            className="text-accent-600"
                          />
                          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-semibold">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-800">
                              {t.name}
                            </p>
                            {t.specialties && (
                              <p className="text-sm text-neutral-500">
                                {t.specialties}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between p-5 border-t border-neutral-200">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一步
              </button>
              {step < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && (!formData.date || !formData.time)) ||
                    (step === 2 && !formData.memberId) ||
                    (step === 3 && !formData.serviceId)
                  }
                  className="px-4 py-2 bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!formData.technicianId}
                  className="px-4 py-2 bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认预约
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
