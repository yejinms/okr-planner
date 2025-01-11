import React, { useState, useEffect } from "react";
import {
  Star,
  Brain,
  Settings,
  ArrowUpCircle,
  Target,
  CheckCircle2,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Upload,
} from "lucide-react";

// 초기 상태 생성 함수
const createInitialState = (id = crypto.randomUUID(), number = 1) => ({
  id,
  title: `목표 ${number}`,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  vision: {
    dream: "",
    reasons: Array.from({ length: 3 }, (_, i) => ({ id: i + 1, text: "" })),
  },
  system: {
    dailyRoutines: [{ id: 1, text: "", checked: false }],
    behaviorRules: [{ id: 1, text: "", checked: false }],
  },
  environment: {
    selectedDays: [],
    preferredTime: "",
    obstacles: [{ id: 1, text: "", checked: false }],
    essentials: [{ id: 1, text: "", checked: false }],
  },
  feedback: {
    weeklyReviews: [],
    monthlyReviews: [],
  },
  motivation: {
    rewards: [{ id: 1, text: "", checked: false }],
  },
  milestones: {
    intermediate: [{ id: 1, text: "", checked: false }],
    final: [{ id: 1, text: "", checked: false }],
  },
});

// 스토리지 유틸리티
const storageUtils = {
  getAllOKRs() {
    try {
      const okrList = localStorage.getItem("okrList");
      if (!okrList) return [];
      return JSON.parse(okrList);
    } catch (err) {
      console.error("Error loading OKR list:", err);
      return [];
    }
  },

  saveOKR(okr) {
    try {
      const okrs = this.getAllOKRs();
      const index = okrs.findIndex((item) => item.id === okr.id);

      if (index >= 0) {
        okrs[index] = { ...okr, lastModified: new Date().toISOString() };
      } else {
        okrs.push({ ...okr, lastModified: new Date().toISOString() });
      }

      localStorage.setItem("okrList", JSON.stringify(okrs));
    } catch (err) {
      console.error("Error saving OKR:", err);
    }
  },

  exportOKR(okr) {
    const blob = new Blob([JSON.stringify(okr, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${okr.title}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importOKR(file) {
    try {
      const text = await file.text();
      const importedOKR = JSON.parse(text);
      importedOKR.id = crypto.randomUUID();
      return importedOKR;
    } catch (err) {
      console.error("Error importing OKR:", err);
      return null;
    }
  },

  deleteOKR(okrId) {
    try {
      let okrs = this.getAllOKRs();

      // 목표1은 삭제 불가
      const targetOKR = okrs.find((okr) => okr.id === okrId);
      if (targetOKR?.title === "목표 1") {
        console.warn("목표 1은 삭제할 수 없습니다.");
        return okrs;
      }

      okrs = okrs.filter((okr) => okr.id !== okrId);
      // 번호 재할당 (목표 1은 그대로 유지)
      okrs = okrs.map((okr, index) => {
        if (okr.title === "목표 1") return okr;
        return {
          ...okr,
          title: `목표 ${index + 1 + (okrs[0]?.title === "목표 1" ? 1 : 0)}`,
        };
      });

      localStorage.setItem("okrList", JSON.stringify(okrs));
      return okrs;
    } catch (err) {
      console.error("Error deleting OKR:", err);
      return [];
    }
  },
};
// 기본 버튼 컴포넌트
const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 섹션 컴포넌트
const Section = ({ title, icon: Icon, children, progress }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-4 rounded-lg border-2 border-rose-200 bg-white overflow-hidden shadow-sm">
      <div
        className={`p-4 cursor-pointer flex items-center justify-between ${
          expanded ? "bg-gradient-to-r from-rose-50 to-pink-50" : ""
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          {typeof progress === "number" && (
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {progress.toFixed(0)}%
              </span>
            </div>
          )}
          <Sparkles className="w-4 h-4 text-rose-400" />
        </div>
      </div>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
};

// 리스트 입력 컴포넌트
const ListInput = ({
  items = [],
  onAdd,
  onRemove,
  onUpdate,
  onToggle,
  placeholder,
  allowCheck = true,
}) => (
  <div className="space-y-2">
    {items.map((item) => (
      <div key={item.id} className="flex items-center gap-2">
        {allowCheck && (
          <button onClick={() => onToggle?.(item.id)} className="flex-shrink-0">
            {item.checked ? (
              <CheckSquare className="w-5 h-5 text-rose-500" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
        <input
          type="text"
          value={item.text}
          onChange={(e) => onUpdate?.(item.id, e.target.value)}
          placeholder={placeholder}
          className="flex-grow p-2 border border-gray-200 rounded-md 
                   focus:ring-2 focus:ring-rose-200 focus:border-rose-300
                   outline-none transition-all"
        />
        <button
          onClick={() => onRemove?.(item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ))}
    <button
      onClick={onAdd}
      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span>항목 추가</span>
    </button>
  </div>
);

// 리뷰 입력 컴포넌트
const ReviewInput = ({ reviews = [], onAdd, onRemove, onUpdate, title }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="font-medium text-gray-700">{title}</label>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-rose-500 hover:text-rose-600"
      >
        <Plus className="w-4 h-4" />
        <span>리뷰 추가</span>
      </button>
    </div>
    {reviews.map((review) => (
      <div
        key={review.id}
        className="space-y-2 p-4 bg-rose-50 rounded-lg relative"
      >
        <button
          onClick={() => onRemove(review.id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <input
          type="date"
          value={review.date}
          onChange={(e) => onUpdate(review.id, "date", e.target.value)}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-rose-200"
        />
        <textarea
          value={review.comment}
          onChange={(e) => onUpdate(review.id, "comment", e.target.value)}
          placeholder="이번 리뷰의 내용을 작성해주세요"
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-rose-200 min-h-[100px]"
        />
      </div>
    ))}
  </div>
);

// 메인 앱 컴포넌트
function App() {
  const [okrList, setOKRList] = useState([]);
  const [currentOKR, setCurrentOKR] = useState(null);

  useEffect(() => {
    const savedOKRs = storageUtils.getAllOKRs();
    setOKRList(savedOKRs);
    if (savedOKRs.length > 0) {
      setCurrentOKR(savedOKRs[0]);
    } else {
      const newOKR = createInitialState();
      setCurrentOKR(newOKR);
      storageUtils.saveOKR(newOKR);
      setOKRList([newOKR]);
    }
  }, []);

  const handleUpdate = (updatedOKR) => {
    setCurrentOKR(updatedOKR);
    storageUtils.saveOKR(updatedOKR);
    setOKRList(storageUtils.getAllOKRs());
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const importedOKR = await storageUtils.importOKR(file);
    if (importedOKR) {
      setCurrentOKR(importedOKR);
      storageUtils.saveOKR(importedOKR);
      setOKRList(storageUtils.getAllOKRs());
    }
  };

  const handleAddSection = (section, subSection) => {
    const newItem = { id: Date.now(), text: "", checked: false };
    handleUpdate({
      ...currentOKR,
      [section]: {
        ...currentOKR[section],
        [subSection]: [...currentOKR[section][subSection], newItem],
      },
    });
  };

  const handleRemoveSection = (section, subSection, id) => {
    handleUpdate({
      ...currentOKR,
      [section]: {
        ...currentOKR[section],
        [subSection]: currentOKR[section][subSection].filter(
          (item) => item.id !== id
        ),
      },
    });
  };

  const handleUpdateSection = (section, subSection, id, text) => {
    handleUpdate({
      ...currentOKR,
      [section]: {
        ...currentOKR[section],
        [subSection]: currentOKR[section][subSection].map((item) =>
          item.id === id ? { ...item, text } : item
        ),
      },
    });
  };

  const handleToggleSection = (section, subSection, id) => {
    handleUpdate({
      ...currentOKR,
      [section]: {
        ...currentOKR[section],
        [subSection]: currentOKR[section][subSection].map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      },
    });
  };

  const handleAddNewOKR = () => {
    const newOKR = createInitialState(crypto.randomUUID(), okrList.length + 1);
    setCurrentOKR(newOKR);
    storageUtils.saveOKR(newOKR);
    setOKRList(storageUtils.getAllOKRs());
  };

  const handleDeleteOKR = (okrId) => {
    const updatedOKRs = storageUtils.deleteOKR(okrId);
    setOKRList(updatedOKRs);
    if (currentOKR.id === okrId) {
      setCurrentOKR(updatedOKRs[0] || null);
    }
  };

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  if (!currentOKR) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 p-6 font-['Dongle']">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-transparent bg-clip-text">
              OKR 플래너
              <span className="ml-2" role="img" aria-label="sparkles">
                ✨
              </span>
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={handleAddNewOKR}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                목표 추가
              </Button>
              <Button
                onClick={() => storageUtils.exportOKR(currentOKR)}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  onClick={() =>
                    document.getElementById("import-file")?.click()
                  }
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  가져오기
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {okrList.map((okr) => (
              <div key={okr.id} className="flex items-center gap-1">
                <Button
                  onClick={() => setCurrentOKR(okr)}
                  className={`whitespace-nowrap ${
                    currentOKR?.id === okr.id
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {okr.title}
                </Button>
                {okr.title !== "목표 1" && ( // 목표 1의 삭제 버튼은 렌더링하지 않음
                  <button
                    onClick={() => handleDeleteOKR(okr.id)}
                    className="p-1 rounded-full hover:bg-rose-100 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 비전 섹션 */}
        <Section id="vision" title="비전 (Vision)" icon={Star}>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700">꿈꾸는 모습</label>
              <textarea
                value={currentOKR.vision.dream}
                onChange={(e) =>
                  handleUpdate({
                    ...currentOKR,
                    vision: { ...currentOKR.vision, dream: e.target.value },
                  })
                }
                className="w-full p-2 mt-2 border rounded-md focus:ring-2 focus:ring-rose-200 min-h-[100px]"
                placeholder="이 목표를 통해 이루고 싶은 궁극적인 모습은 무엇인가요?"
              />
            </div>
            <div>
              <label className="font-medium text-gray-700">
                목표 선정 이유
              </label>
              <ListInput
                items={currentOKR.vision.reasons}
                onAdd={() => handleAddSection("vision", "reasons")}
                onRemove={(id) => handleRemoveSection("vision", "reasons", id)}
                onUpdate={(id, text) =>
                  handleUpdateSection("vision", "reasons", id, text)
                }
                placeholder="이 목표를 선택한 이유를 작성해주세요"
                allowCheck={false}
              />
            </div>
          </div>
        </Section>

        {/* 시스템 섹션 */}
        <Section id="system" title="시스템 만들기" icon={Brain}>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700">일상 루틴</label>
              <ListInput
                items={currentOKR.system.dailyRoutines}
                onAdd={() => handleAddSection("system", "dailyRoutines")}
                onRemove={(id) =>
                  handleRemoveSection("system", "dailyRoutines", id)
                }
                onUpdate={(id, text) =>
                  handleUpdateSection("system", "dailyRoutines", id, text)
                }
                onToggle={(id) =>
                  handleToggleSection("system", "dailyRoutines", id)
                }
                placeholder="규칙적으로 실천할 활동을 입력하세요"
              />
            </div>
            <div>
              <label className="font-medium text-gray-700">행동 규칙</label>
              <ListInput
                items={currentOKR.system.behaviorRules}
                onAdd={() => handleAddSection("system", "behaviorRules")}
                onRemove={(id) =>
                  handleRemoveSection("system", "behaviorRules", id)
                }
                onUpdate={(id, text) =>
                  handleUpdateSection("system", "behaviorRules", id, text)
                }
                onToggle={(id) =>
                  handleToggleSection("system", "behaviorRules", id)
                }
                placeholder="실천할 때 지켜야 할 원칙을 입력하세요"
              />
            </div>
          </div>
        </Section>

        {/* 환경 섹션 */}
        <Section id="environment" title="환경 조성" icon={Settings}>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700">시간 계획</label>
              <div className="mt-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        const newDays =
                          currentOKR.environment.selectedDays.includes(day)
                            ? currentOKR.environment.selectedDays.filter(
                                (d) => d !== day
                              )
                            : [...currentOKR.environment.selectedDays, day];
                        handleUpdate({
                          ...currentOKR,
                          environment: {
                            ...currentOKR.environment,
                            selectedDays: newDays,
                          },
                        });
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        currentOKR.environment.selectedDays.includes(day)
                          ? "bg-rose-500 text-white"
                          : "bg-rose-100 text-rose-500"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={currentOKR.environment.preferredTime}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentOKR,
                      environment: {
                        ...currentOKR.environment,
                        preferredTime: e.target.value,
                      },
                    })
                  }
                  placeholder="선호하는 시간대를 입력해주세요 (예: 오전 10시)"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>
            <div>
              <label className="font-medium text-gray-700">방해 요소</label>
              <ListInput
                items={currentOKR.environment.obstacles}
                onAdd={() => handleAddSection("environment", "obstacles")}
                onRemove={(id) =>
                  handleRemoveSection("environment", "obstacles", id)
                }
                onUpdate={(id, text) =>
                  handleUpdateSection("environment", "obstacles", id, text)
                }
                onToggle={(id) =>
                  handleToggleSection("environment", "obstacles", id)
                }
                placeholder="제거하거나 개선해야 할 방해 요소를 입력하세요"
              />
            </div>
            <div>
              <label className="font-medium text-gray-700">필수 요소</label>
              <ListInput
                items={currentOKR.environment.essentials}
                onAdd={() => handleAddSection("environment", "essentials")}
                onRemove={(id) =>
                  handleRemoveSection("environment", "essentials", id)
                }
                onUpdate={(id, text) =>
                  handleUpdateSection("environment", "essentials", id, text)
                }
                onToggle={(id) =>
                  handleToggleSection("environment", "essentials", id)
                }
                placeholder="준비해야 할 필수 요소를 입력하세요"
              />
            </div>
          </div>
        </Section>

        {/* 피드백 섹션 */}
        <Section id="feedback" title="피드백 및 개선 루틴" icon={ArrowUpCircle}>
          <div className="space-y-6">
            <ReviewInput
              reviews={currentOKR.feedback.weeklyReviews}
              onAdd={() => {
                const newReview = {
                  id: Date.now(),
                  date: "",
                  comment: "",
                };
                handleUpdate({
                  ...currentOKR,
                  feedback: {
                    ...currentOKR.feedback,
                    weeklyReviews: [
                      ...currentOKR.feedback.weeklyReviews,
                      newReview,
                    ],
                  },
                });
              }}
              onRemove={(id) => {
                handleUpdate({
                  ...currentOKR,
                  feedback: {
                    ...currentOKR.feedback,
                    weeklyReviews: currentOKR.feedback.weeklyReviews.filter(
                      (review) => review.id !== id
                    ),
                  },
                });
              }}
              onUpdate={(id, field, value) => {
                handleUpdate({
                  ...currentOKR,
                  feedback: {
                    ...currentOKR.feedback,
                    weeklyReviews: currentOKR.feedback.weeklyReviews.map(
                      (review) =>
                        review.id === id
                          ? { ...review, [field]: value }
                          : review
                    ),
                  },
                });
              }}
              title="주간 리뷰"
            />
            <ReviewInput
              reviews={currentOKR.feedback.monthlyReviews}
              onAdd={() => {
                const newReview = {
                  id: Date.now(),
                  date: "",
                  comment: "",
                };
                handleUpdate({
                  ...currentOKR,
                  feedback: {
                    ...currentOKR.feedback,
                    monthlyReviews: [
                      ...currentOKR.feedback.monthlyReviews,
                      newReview,
                    ],
                  },
                });
              }}
              onRemove={(id) => {
                handleUpdate({
                  ...currentOKR,
                  feedback: {
                    ...currentOKR.feedback,
                    monthlyReviews: currentOKR.feedback.monthlyReviews.filter(
                      (review) => review.id !== id
                    ),
                  },
                });
              }}
              onUpdate={(id, field, value) => {
                handleUpdate({
                  ...currentOKR,
                  feedback: {
                    ...currentOKR.feedback,
                    monthlyReviews: currentOKR.feedback.monthlyReviews.map(
                      (review) =>
                        review.id === id
                          ? { ...review, [field]: value }
                          : review
                    ),
                  },
                });
              }}
              title="월간 성찰"
            />
          </div>
        </Section>

        {/* 동기부여 섹션 */}
        <Section id="motivation" title="동기부여 전략" icon={Target}>
          <div>
            <label className="font-medium text-gray-700">보상 시스템</label>
            <ListInput
              items={currentOKR.motivation.rewards}
              onAdd={() => handleAddSection("motivation", "rewards")}
              onRemove={(id) =>
                handleRemoveSection("motivation", "rewards", id)
              }
              onUpdate={(id, text) =>
                handleUpdateSection("motivation", "rewards", id, text)
              }
              onToggle={(id) =>
                handleToggleSection("motivation", "rewards", id)
              }
              placeholder="작은 성공을 축하하는 방법을 입력하세요"
            />
          </div>
        </Section>

        {/* 마일스톤 섹션 */}
        <Section id="milestones" title="마일스톤" icon={CheckCircle2}>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-gray-700">중간 목표</label>
              <ListInput
                items={currentOKR.milestones.intermediate}
                onAdd={() => handleAddSection("milestones", "intermediate")}
                onRemove={(id) =>
                  handleRemoveSection("milestones", "intermediate", id)
                }
                onUpdate={(id, text) =>
                  handleUpdateSection("milestones", "intermediate", id, text)
                }
                onToggle={(id) =>
                  handleToggleSection("milestones", "intermediate", id)
                }
                placeholder="구체적이고 측정 가능한 중간 목표를 입력하세요"
              />
            </div>
            <div>
              <label className="font-medium text-gray-700">최종 목표</label>
              <ListInput
                items={currentOKR.milestones.final}
                onAdd={() => handleAddSection("milestones", "final")}
                onRemove={(id) =>
                  handleRemoveSection("milestones", "final", id)
                }
                onUpdate={(id, text) =>
                  handleUpdateSection("milestones", "final", id, text)
                }
                onToggle={(id) =>
                  handleToggleSection("milestones", "final", id)
                }
                placeholder="최종적으로 도전하고 싶은 목표를 입력하세요"
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default App;
