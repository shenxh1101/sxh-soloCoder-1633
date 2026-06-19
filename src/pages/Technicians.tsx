import { useEffect, useState } from "react";
import { Plus, X, Phone, Scissors, UserCog } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Technician } from "../../shared/types";

export default function Technicians() {
  const { technicians, loadTechnicians, addTechnician } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    specialties: "",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTechnicians();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    try {
      setSubmitting(true);
      await addTechnician({
        name: formData.name,
        phone: formData.phone,
        specialties: formData.specialties,
      });
      setIsModalOpen(false);
      setFormData({ name: "", phone: "", specialties: "" });
    } catch {
      alert("添加技师失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-neutral-500">
          共 {technicians.length} 位技师
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-700 text-white rounded-lg shadow-md hover:bg-accent-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增技师
        </button>
      </div>

      {technicians.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
          <UserCog className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">暂无技师数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {technicians.map((tech: Technician) => (
            <div
              key={tech.id}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-100 to-brand-100 flex items-center justify-center text-2xl font-bold text-accent-700 flex-shrink-0">
                  {tech.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-neutral-800">
                    {tech.name}
                  </h3>
                  <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {tech.phone}
                  </p>
                </div>
              </div>
              {tech.specialties && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5" />
                    擅长项目
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tech.specialties.split(/[,，、]/).map((s, i) => (
                      <span
                        key={i}
                        className="text-xs bg-accent-50 text-accent-700 px-2 py-1 rounded-md"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">新增技师</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  电话 *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="请输入电话"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  擅长项目
                </label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={(e) =>
                    setFormData({ ...formData, specialties: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="多个项目用逗号分隔，如：剪发,烫发,染发"
                />
              </div>
            </form>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.phone || submitting}
                className="px-4 py-2 bg-accent-700 text-white rounded-lg hover:bg-accent-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "添加中..." : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
