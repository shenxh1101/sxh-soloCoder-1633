import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Wallet,
  CreditCard,
  X,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type {
  Member,
  RechargeRule,
  ServiceItem,
  Technician,
} from "../../shared/types";
import { cn } from "@/lib/utils";

export default function Members() {
  const {
    members,
    services,
    technicians,
    rechargeRules,
    loadMembers,
    loadServices,
    loadTechnicians,
    loadRechargeRules,
    addMember,
    rechargeMemberStore,
    consumeMemberStore,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    birthday: "",
    hairPreference: "",
  });

  const [rechargeData, setRechargeData] = useState({
    ruleId: 0,
    customAmount: "",
    bonusAmount: 0,
  });

  const [consumeData, setConsumeData] = useState({
    serviceId: 0,
    technicianId: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadMembers();
    loadServices();
    loadTechnicians();
    loadRechargeRules();
  }, []);

  const filteredMembers = members.filter(
    (m: Member) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone) return;
    try {
      await addMember(newMember);
      setIsAddModalOpen(false);
      setNewMember({ name: "", phone: "", birthday: "", hairPreference: "" });
    } catch {
      alert("添加会员失败");
    }
  };

  const openRechargeModal = (member: Member) => {
    setSelectedMember(member);
    setRechargeData({ ruleId: 0, customAmount: "", bonusAmount: 0 });
    setIsRechargeModalOpen(true);
  };

  const openConsumeModal = (member: Member) => {
    setSelectedMember(member);
    setConsumeData({ serviceId: 0, technicianId: 0 });
    setIsConsumeModalOpen(true);
  };

  const handleRecharge = async () => {
    if (!selectedMember) return;
    let amount = 0;
    let bonus = 0;

    if (rechargeData.ruleId > 0) {
      const rule = rechargeRules.find(
        (r: RechargeRule) => r.id === rechargeData.ruleId
      );
      if (rule) {
        amount = rule.rechargeAmount;
        bonus = rule.bonusAmount;
      }
    } else if (rechargeData.customAmount) {
      amount = parseFloat(rechargeData.customAmount);
      bonus = rechargeData.bonusAmount;
    }

    if (amount <= 0) return;

    try {
      await rechargeMemberStore(selectedMember.id, {
        amount: amount + bonus,
      });
      setIsRechargeModalOpen(false);
    } catch {
      alert("充值失败");
    }
  };

  const handleConsume = async () => {
    if (!selectedMember || !consumeData.serviceId || !consumeData.technicianId)
      return;
    const service = services.find((s: ServiceItem) => s.id === consumeData.serviceId);
    if (!service) return;
    try {
      await consumeMemberStore(selectedMember.id, {
        amount: service.price,
        serviceId: consumeData.serviceId,
        technicianId: consumeData.technicianId,
      });
      setIsConsumeModalOpen(false);
    } catch {
      alert("消费失败");
    }
  };

  const selectedService = services.find(
    (s: ServiceItem) => s.id === consumeData.serviceId
  );
  const estimatedPoints = selectedService ? Math.floor(selectedService.price / 10) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索会员姓名或手机号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-700 text-white rounded-lg shadow-md hover:bg-accent-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增会员
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="w-10"></th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                  姓名
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                  手机号
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                  生日
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                  余额
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                  积分
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                  发型偏好
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">
                  爽约次数
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-neutral-400"
                  >
                    暂无会员数据
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member: Member, idx: number) => (
                  <>
                    <tr
                      key={member.id}
                      className={cn(
                        "hover:bg-neutral-50 transition-colors cursor-pointer",
                        idx % 2 === 1 ? "bg-neutral-50/50" : ""
                      )}
                      onClick={() =>
                        setExpandedId(
                          expandedId === member.id ? null : member.id
                        )
                      }
                    >
                      <td className="px-4 py-3">
                        {expandedId === member.id ? (
                          <ChevronUp className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-800">
                            {member.name}
                          </span>
                          {member.noShowCount >= 2 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              警告
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {member.phone}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {member.birthday || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-accent-700">
                        ¥{member.balance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-brand-600">
                        {member.points}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {member.hairPreference || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                            member.noShowCount >= 2
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-600"
                          )}
                        >
                          {member.noShowCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRechargeModal(member);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                          >
                            <Wallet className="w-4 h-4" />
                            充值
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openConsumeModal(member);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            消费
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === member.id && (
                      <tr className="bg-neutral-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-brand-500" />
                                充值记录
                              </h4>
                              <p className="text-sm text-neutral-400">
                                暂无数据
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-accent-700" />
                                消费记录
                              </h4>
                              <p className="text-sm text-neutral-400">
                                暂无数据
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">
                新增会员
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  手机号 *
                </label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) =>
                    setNewMember({ ...newMember, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  生日
                </label>
                <input
                  type="date"
                  value={newMember.birthday}
                  onChange={(e) =>
                    setNewMember({ ...newMember, birthday: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  发型偏好
                </label>
                <input
                  type="text"
                  value={newMember.hairPreference}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      hairPreference: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="如：短发、烫发等"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.phone}
                className="px-4 py-2 bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {isRechargeModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">
                会员充值 - {selectedMember.name}
              </h3>
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  充值规则
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {rechargeRules.map((rule: RechargeRule) => (
                    <label
                      key={rule.id}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-colors",
                        rechargeData.ruleId === rule.id
                          ? "border-accent-500 bg-accent-50"
                          : "border-neutral-200 hover:bg-neutral-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="rechargeRule"
                        className="sr-only"
                        checked={rechargeData.ruleId === rule.id}
                        onChange={() => {
                          setRechargeData({
                            ruleId: rule.id,
                            customAmount: "",
                            bonusAmount: rule.bonusAmount,
                          });
                        }}
                      />
                      <span className="text-lg font-bold text-accent-700">
                        充¥{rule.rechargeAmount}
                      </span>
                      <span className="text-sm text-brand-600 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        送¥{rule.bonusAmount}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-neutral-500">
                    或自定义金额
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  自定义金额
                </label>
                <input
                  type="number"
                  value={rechargeData.customAmount}
                  onChange={(e) => {
                    setRechargeData({
                      ...rechargeData,
                      ruleId: 0,
                      customAmount: e.target.value,
                    });
                  }}
                  placeholder="输入自定义金额"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>

              {rechargeData.ruleId === 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    赠送金额
                  </label>
                  <input
                    type="number"
                    value={rechargeData.bonusAmount}
                    onChange={(e) =>
                      setRechargeData({
                        ...rechargeData,
                        bonusAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">当前余额</span>
                  <span className="font-semibold">
                    ¥{selectedMember.balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-600">充值金额</span>
                  <span className="font-semibold text-accent-700">
                    +¥
                    {rechargeData.ruleId > 0
                      ? rechargeRules.find(
                          (r: RechargeRule) => r.id === rechargeData.ruleId
                        )?.rechargeAmount || 0
                      : parseFloat(rechargeData.customAmount) || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-600">赠送金额</span>
                  <span className="font-semibold text-brand-600">
                    +¥{rechargeData.bonusAmount}
                  </span>
                </div>
                <div className="border-t border-neutral-200 my-2" />
                <div className="flex justify-between">
                  <span className="font-medium text-neutral-700">
                    充值后余额
                  </span>
                  <span className="text-lg font-bold text-accent-700">
                    ¥
                    {(
                      selectedMember.balance +
                      (rechargeData.ruleId > 0
                        ? rechargeRules.find(
                            (r: RechargeRule) => r.id === rechargeData.ruleId
                          )?.rechargeAmount || 0
                        : parseFloat(rechargeData.customAmount) || 0) +
                      rechargeData.bonusAmount
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRecharge}
                disabled={
                  rechargeData.ruleId <= 0 && !rechargeData.customAmount
                }
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认充值
              </button>
            </div>
          </div>
        </div>
      )}

      {isConsumeModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">
                会员消费 - {selectedMember.name}
              </h3>
              <button
                onClick={() => setIsConsumeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  选择服务项目
                </label>
                <select
                  value={consumeData.serviceId}
                  onChange={(e) =>
                    setConsumeData({
                      ...consumeData,
                      serviceId: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  <option value={0}>请选择服务项目</option>
                  {services.map((s: ServiceItem) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ¥{s.price} ({s.duration}分钟)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  选择技师
                </label>
                <select
                  value={consumeData.technicianId}
                  onChange={(e) =>
                    setConsumeData({
                      ...consumeData,
                      technicianId: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  <option value={0}>请选择技师</option>
                  {technicians.map((t: Technician) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">当前余额</span>
                  <span className="font-semibold">
                    ¥{selectedMember.balance.toFixed(2)}
                  </span>
                </div>
                {selectedService && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">消费金额</span>
                      <span className="font-semibold text-accent-700">
                        -¥{selectedService.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">获得积分</span>
                      <span className="font-semibold text-brand-600">
                        +{estimatedPoints}
                      </span>
                    </div>
                  </>
                )}
                {selectedService && (
                  <>
                    <div className="border-t border-neutral-200 my-2" />
                    <div className="flex justify-between">
                      <span className="font-medium text-neutral-700">
                        消费后余额
                      </span>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          selectedMember.balance - selectedService.price >= 0
                            ? "text-accent-700"
                            : "text-red-600"
                        )}
                      >
                        ¥
                        {(
                          selectedMember.balance - selectedService.price
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
              <button
                onClick={() => setIsConsumeModalOpen(false)}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConsume}
                disabled={
                  !consumeData.serviceId || !consumeData.technicianId
                }
                className="px-4 py-2 bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认消费
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
