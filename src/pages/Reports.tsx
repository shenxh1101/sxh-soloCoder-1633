import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Wallet, Users, TrendingUp, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import * as api from "@/lib/api";
import type {
  TechnicianReport,
  ServiceReport,
  RechargeReport,
  TechnicianDetailReport,
  ServiceDetailReport,
} from "../../shared/types";
import { cn } from "@/lib/utils";

const COLORS = ["#7C2D12", "#D97706", "#059669", "#2563EB", "#7C3AED", "#DC2626"];

export default function Reports() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [techReports, setTechReports] = useState<TechnicianReport[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [rechargeReport, setRechargeReport] = useState<RechargeReport>({
    rechargeCount: 0,
    totalRecharge: 0,
    totalBonus: 0,
    rules: [],
  });
  const [loading, setLoading] = useState(true);

  const [expandedTechId, setExpandedTechId] = useState<number | null>(null);
  const [techDetails, setTechDetails] = useState<TechnicianDetailReport | null>(null);
  const [techDetailLoading, setTechDetailLoading] = useState(false);

  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetailReport | null>(null);
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false);

  useEffect(() => {
    setExpandedTechId(null);
    setExpandedServiceId(null);
    setTechDetails(null);
    setServiceDetails(null);
    fetchReports();
  }, [selectedMonth]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [techs, services, recharge] = await Promise.all([
        api.getTechnicianReports(selectedMonth),
        api.getServiceReports(selectedMonth),
        api.getRechargeReports(selectedMonth),
      ]);
      setTechReports(techs || []);
      setServiceReports(services || []);
      setRechargeReport(recharge || {
        rechargeCount: 0,
        totalRecharge: 0,
        totalBonus: 0,
        rules: [],
      });
    } catch {
      setTechReports([]);
      setServiceReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTech = async (techId: number) => {
    if (expandedTechId === techId) {
      setExpandedTechId(null);
      setTechDetails(null);
      return;
    }
    setExpandedTechId(techId);
    setTechDetailLoading(true);
    try {
      const details = await api.getTechnicianDetail(selectedMonth, techId);
      setTechDetails(details);
    } catch {
      setTechDetails(null);
    } finally {
      setTechDetailLoading(false);
    }
  };

  const handleToggleService = async (serviceId: number) => {
    if (expandedServiceId === serviceId) {
      setExpandedServiceId(null);
      setServiceDetails(null);
      return;
    }
    setExpandedServiceId(serviceId);
    setServiceDetailLoading(true);
    try {
      const details = await api.getServiceDetail(selectedMonth, serviceId);
      setServiceDetails(details);
    } catch {
      setServiceDetails(null);
    } finally {
      setServiceDetailLoading(false);
    }
  };

  const techChartData = techReports.map((t) => ({
    name: t.name,
    服务次数: t.appointmentCount,
    营收: t.revenue,
  }));

  const serviceChartData = serviceReports.map((s) => ({
    name: s.name,
    value: s.appointmentCount,
  }));

  const avgRecharge = rechargeReport.rechargeCount > 0
    ? rechargeReport.totalRecharge / rechargeReport.rechargeCount
    : 0;

  const statCards = [
    {
      label: "总充值金额",
      value: `¥${rechargeReport.totalRecharge.toFixed(2)}`,
      icon: Wallet,
      color: "bg-brand-100 text-brand-600",
    },
    {
      label: "充值人数",
      value: rechargeReport.rechargeCount,
      icon: Users,
      color: "bg-accent-100 text-accent-700",
    },
    {
      label: "平均充值金额",
      value: `¥${avgRecharge.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-green-100 text-green-700",
    },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-700" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-lg font-semibold text-neutral-800 bg-transparent border-none focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{card.label}</p>
                  <p className="text-2xl font-bold text-neutral-800 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">技师绩效</h3>
          {loading || techReports.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-neutral-400">
              暂无数据
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="服务次数"
                    fill="#7C2D12"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="营收"
                    fill="#D97706"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {techReports.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-600 mb-2">技师明细</h4>
              <div className="space-y-1">
                {techReports.map((tech) => (
                  <div key={tech.id}>
                    <button
                      onClick={() => handleToggleTech(tech.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {expandedTechId === tech.id ? (
                          <ChevronUp className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="font-medium text-neutral-800">{tech.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-neutral-600">
                          服务 <span className="font-semibold text-accent-700">{tech.appointmentCount}</span> 次
                        </span>
                        <span className="text-neutral-600">
                          营收 <span className="font-semibold text-brand-600">¥{tech.revenue.toFixed(2)}</span>
                        </span>
                      </div>
                    </button>
                    {expandedTechId === tech.id && (
                      <div className="ml-7 mr-3 mb-2 bg-neutral-50 rounded-lg p-3">
                        {techDetailLoading ? (
                          <p className="text-sm text-neutral-400 text-center py-2">加载中...</p>
                        ) : !techDetails || techDetails.transactions.length === 0 ? (
                          <p className="text-sm text-neutral-400 text-center py-2">暂无明细</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-neutral-200">
                                <th className="text-left py-1.5 px-2 font-medium text-neutral-500">日期</th>
                                <th className="text-left py-1.5 px-2 font-medium text-neutral-500">客户</th>
                                <th className="text-left py-1.5 px-2 font-medium text-neutral-500">服务项目</th>
                                <th className="text-right py-1.5 px-2 font-medium text-neutral-500">金额</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {techDetails.transactions.map((d) => (
                                <tr key={d.id}>
                                  <td className="py-1.5 px-2 text-neutral-600">{formatDate(d.createdAt)}</td>
                                  <td className="py-1.5 px-2 text-neutral-600">{d.memberName}</td>
                                  <td className="py-1.5 px-2 text-neutral-600">{d.serviceName}</td>
                                  <td className="py-1.5 px-2 text-right font-medium text-brand-600">¥{d.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">项目销量</h3>
          {loading || serviceReports.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-neutral-400">
              暂无数据
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {serviceReports.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-600 mb-2">项目明细</h4>
              <div className="space-y-1">
                {serviceReports.map((svc) => (
                  <div key={svc.id}>
                    <button
                      onClick={() => handleToggleService(svc.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {expandedServiceId === svc.id ? (
                          <ChevronUp className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="font-medium text-neutral-800">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-neutral-600">
                          次数 <span className="font-semibold text-accent-700">{svc.appointmentCount}</span>
                        </span>
                        <span className="text-neutral-600">
                          营收 <span className="font-semibold text-brand-600">¥{svc.revenue.toFixed(2)}</span>
                        </span>
                      </div>
                    </button>
                    {expandedServiceId === svc.id && (
                      <div className="ml-7 mr-3 mb-2 bg-neutral-50 rounded-lg p-3">
                        {serviceDetailLoading ? (
                          <p className="text-sm text-neutral-400 text-center py-2">加载中...</p>
                        ) : !serviceDetails || serviceDetails.transactions.length === 0 ? (
                          <p className="text-sm text-neutral-400 text-center py-2">暂无明细</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-neutral-200">
                                <th className="text-left py-1.5 px-2 font-medium text-neutral-500">日期</th>
                                <th className="text-left py-1.5 px-2 font-medium text-neutral-500">客户</th>
                                <th className="text-left py-1.5 px-2 font-medium text-neutral-500">技师</th>
                                <th className="text-right py-1.5 px-2 font-medium text-neutral-500">金额</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {serviceDetails.transactions.map((d) => (
                                <tr key={d.id}>
                                  <td className="py-1.5 px-2 text-neutral-600">{formatDate(d.createdAt)}</td>
                                  <td className="py-1.5 px-2 text-neutral-600">{d.memberName}</td>
                                  <td className="py-1.5 px-2 text-neutral-600">{d.technicianName}</td>
                                  <td className="py-1.5 px-2 text-right font-medium text-brand-600">¥{d.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
