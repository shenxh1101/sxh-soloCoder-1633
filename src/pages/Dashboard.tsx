import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  DollarSign,
  Users,
  Wallet,
  Gift,
  Plus,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Appointment, Member } from "../../shared/types";

function getDaysUntilBirthday(birthday: string): number {
  const today = new Date();
  const todayYear = today.getFullYear();
  const [, month, day] = birthday.split("-").map(Number);
  const birthdayThisYear = new Date(todayYear, month - 1, day);
  const todayStart = new Date(todayYear, today.getMonth(), today.getDate());
  const diffMs = birthdayThisYear.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 0) {
    return diffDays;
  }
  const birthdayNextYear = new Date(todayYear + 1, month - 1, day);
  return Math.ceil((birthdayNextYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}

const statCards = [
  {
    label: "今日预约数",
    key: "todayAppointments",
    icon: CalendarDays,
    color: "bg-accent-100 text-accent-700",
  },
  {
    label: "本月营收",
    key: "monthlyRevenue",
    icon: DollarSign,
    color: "bg-brand-100 text-brand-600",
    prefix: "¥",
  },
  {
    label: "会员总数",
    key: "totalMembers",
    icon: Users,
    color: "bg-green-100 text-green-700",
  },
  {
    label: "本月充值金额",
    key: "monthlyRecharge",
    icon: Wallet,
    color: "bg-blue-100 text-blue-700",
    prefix: "¥",
  },
];

export default function Dashboard() {
  const {
    members,
    appointments,
    loadMembers,
    loadAppointments,
    loadBirthdayMembers,
    handleBirthday,
  } = useAppStore();
  const [birthdayMembers, setBirthdayMembers] = useState<Member[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [handlingId, setHandlingId] = useState<number | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadMembers();
    loadAppointments();
    fetchBirthdayMembers();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayAppointments(
      appointments.filter((a) => a.date === today)
    );
  }, [appointments]);

  const fetchBirthdayMembers = async () => {
    try {
      const data = await loadBirthdayMembers();
      setBirthdayMembers(data || []);
    } catch {
      setBirthdayMembers([]);
    }
  };

  const handleBirthdayProcess = async (memberId: number, note?: string) => {
    try {
      setHandlingId(memberId);
      await handleBirthday(memberId, note);
      setBirthdayMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      alert("处理失败");
    } finally {
      setHandlingId(null);
    }
  };

  const stats = {
    todayAppointments: todayAppointments.length,
    monthlyRevenue: 0,
    totalMembers: members.length,
    monthlyRecharge: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">欢迎回来</h2>
          <p className="text-neutral-500 text-sm mt-1">
            今天是 {new Date().toLocaleDateString("zh-CN")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-700 text-white rounded-lg shadow-md hover:bg-accent-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建预约
          </Link>
          <Link
            to="/members"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg shadow-md hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增会员
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof typeof stats];
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{card.label}</p>
                  <p className="text-2xl font-bold text-neutral-800 mt-2">
                    {card.prefix}
                    {value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${card.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-brand-500" />
              <h3 className="font-semibold text-neutral-800">即将生日会员</h3>
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                7天内
              </span>
            </div>
            <Link
              to="/members"
              className="text-sm text-accent-700 hover:text-accent-800 flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {birthdayMembers.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-8">
              暂无即将生日的会员
            </p>
          ) : (
            <div className="space-y-2">
              {birthdayMembers.map((member) => {
                const daysUntil = member.birthday ? getDaysUntilBirthday(member.birthday) : 999;
                const isHandling = handlingId === member.id;
                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-800">
                          {member.name}
                        </p>
                        <p className="text-sm text-neutral-500">{member.phone}</p>
                      </div>
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded-full ${
                          daysUntil <= 2
                            ? "bg-accent-100 text-accent-700"
                            : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {daysUntil === 0
                          ? "今天生日"
                          : `${daysUntil}天后`}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleBirthdayProcess(member.id, "已发优惠券")}
                        disabled={isHandling}
                        className="flex-1 text-xs px-2 py-1.5 bg-brand-100 text-brand-700 rounded-md hover:bg-brand-200 transition-colors disabled:opacity-50"
                      >
                        {isHandling ? "处理中..." : "已发优惠券"}
                      </button>
                      <button
                        onClick={() => handleBirthdayProcess(member.id, "已送礼品")}
                        disabled={isHandling}
                        className="flex-1 text-xs px-2 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        {isHandling ? "处理中..." : "已送礼品"}
                      </button>
                      <button
                        onClick={() => handleBirthdayProcess(member.id)}
                        disabled={isHandling}
                        className="text-xs px-2 py-1.5 bg-neutral-100 text-neutral-600 rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50"
                      >
                        已处理
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent-700" />
              <h3 className="font-semibold text-neutral-800">今日预约</h3>
            </div>
            <Link
              to="/appointments"
              className="text-sm text-accent-700 hover:text-accent-800 flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-8">
              今日暂无预约
            </p>
          ) : (
            <div className="space-y-2">
              {todayAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => {
                  const member = members.find(
                    (m: Member) => m.id === appointment.memberId
                  );
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-accent-700 w-14">
                          {appointment.time}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-neutral-800">
                              {appointment.memberName}
                            </p>
                            {member && member.noShowCount >= 2 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                高风险
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">
                            {appointment.technicianName} · {appointment.serviceName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : appointment.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "no_show"
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {appointment.status === "pending"
                          ? "待确认"
                          : appointment.status === "completed"
                          ? "已完成"
                          : appointment.status === "no_show"
                          ? "爽约"
                          : "已取消"}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
