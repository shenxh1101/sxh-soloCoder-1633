import { useEffect, useState } from "react";
import { Plus, Trash2, Gift, Scissors, Clock, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { RechargeRule, ServiceItem } from "../../shared/types";

export default function Settings() {
  const {
    rechargeRules,
    services,
    loadRechargeRules,
    loadServices,
    addRechargeRule,
    removeRechargeRule,
    addService,
  } = useAppStore();

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({ rechargeAmount: "", bonusAmount: "" });
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadRechargeRules();
    loadServices();
  }, []);

  const handleAddRule = async () => {
    if (!newRule.rechargeAmount || !newRule.bonusAmount) return;
    try {
      await addRechargeRule({
        rechargeAmount: parseFloat(newRule.rechargeAmount),
        bonusAmount: parseFloat(newRule.bonusAmount),
      });
      setIsRuleModalOpen(false);
      setNewRule({ rechargeAmount: "", bonusAmount: "" });
    } catch {
      alert("添加充值规则失败");
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm("确定要删除此充值规则吗？")) return;
    try {
      await removeRechargeRule(id);
    } catch {
      alert("删除充值规则失败");
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !newService.duration) return;
    try {
      await addService({
        name: newService.name,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration),
      });
      setIsServiceModalOpen(false);
      setNewService({ name: "", price: "", duration: "" });
    } catch {
      alert("添加服务项目失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-lg text-neutral-800">充值规则管理</h3>
          </div>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg shadow-md hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加规则
          </button>
        </div>

        {rechargeRules.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-8">
            暂无充值规则
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {rechargeRules.map((rule: RechargeRule) => (
              <div
                key={rule.id}
                className="relative flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-accent-50 to-brand-50 border border-accent-100"
              >
                <div>
                  <p className="text-xl font-bold text-accent-700">
                    充¥{rule.rechargeAmount}
                  </p>
                  <p className="text-sm text-brand-600 flex items-center gap-1 mt-1">
                    <Gift className="w-3.5 h-3.5" />
                    赠送¥{rule.bonusAmount}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-accent-700" />
            <h3 className="font-semibold text-lg text-neutral-800">服务项目管理</h3>
          </div>
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-700 text-white rounded-lg shadow-md hover:bg-accent-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加项目
          </button>
        </div>

        {services.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-8">
            暂无服务项目
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                    服务名称
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                    价格
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                    时长
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {services.map((service: ServiceItem, idx: number) => (
                  <tr
                    key={service.id}
                    className={idx % 2 === 1 ? "bg-neutral-50/50 hover:bg-neutral-100/50 transition-colors" : "hover:bg-neutral-50 transition-colors"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                          <Scissors className="w-4 h-4 text-accent-700" />
                        </div>
                        <span className="font-medium text-neutral-800">
                          {service.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-700">
                      ¥{service.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-neutral-600">
                        <Clock className="w-4 h-4" />
                        {service.duration}分钟
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">添加充值规则</h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  充值金额
                </label>
                <input
                  type="number"
                  value={newRule.rechargeAmount}
                  onChange={(e) =>
                    setNewRule({ ...newRule, rechargeAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="请输入充值金额"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  赠送金额
                </label>
                <input
                  type="number"
                  value={newRule.bonusAmount}
                  onChange={(e) =>
                    setNewRule({ ...newRule, bonusAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="请输入赠送金额"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRule.rechargeAmount || !newRule.bonusAmount}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">添加服务项目</h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService({ ...newService, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="如：剪发、烫发等"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    价格 (¥)
                  </label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    placeholder="价格"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    时长 (分钟)
                  </label>
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService({ ...newService, duration: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    placeholder="分钟"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddService}
                disabled={!newService.name || !newService.price || !newService.duration}
                className="px-4 py-2 bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
