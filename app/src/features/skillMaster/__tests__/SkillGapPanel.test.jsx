import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/mocks/server";
import { unifiedCourseDataState } from "../../../components/recoil/unifiedCourseDataAtom";
import { authTokenState } from "../../../components/recoil/authAtom";
import SkillGapPanel from "../components/SkillGapPanel";
import { ROLES, SKILLS } from "../data/catalog";
import { skillPlanAtom, skillProfileAtom, skillWizardAtom } from "../state/skillMasterState";

// The hand-over writes to the backend; the test only checks what is handed over.
const addOrRemoveCourse = vi.fn(async () => {});
vi.mock("../../../components/helpers/useCourseSelection", () => ({
  useCourseSelection: () => ({ addOrRemoveCourse }),
}));

const SKILL_FILE = {
  schemaVersion: "1.0",
  semester: "HS26",
  courses: [
    {
      courseNumber: "7,002,1.00",
      rootKey: "7,002",
      skills: [
        { escoUri: "customer-needs", contribution: 25, aiAutomation: 20, status: "confirmed" },
        { escoUri: "prototyping", contribution: 25, aiAutomation: 35, status: "confirmed" },
      ],
    },
  ],
};

const COURSE = { courseNumber: "7,002,1.00", shortName: "Design Thinking", credits: 400 };

const renderPanel = ({ roleIds = ["product-owner"], loggedIn = true } = {}) => {
  addOrRemoveCourse.mockClear();
  server.use(http.get("*/skill-master/HS26.json", () => HttpResponse.json(SKILL_FILE)));
  const store = createStore();
  render(
    <Provider store={store}>
      <RecoilRoot
        initializeState={({ set }) => {
          if (loggedIn) set(authTokenState, "token");
          set(unifiedCourseDataState, (prev) => ({
            ...prev,
            selectedSemester: "HS26",
            semesters: { HS26: { available: [COURSE], selectedIds: [], enrolledIds: [] } },
          }));
        }}
      >
        <SkillGapPanel />
      </RecoilRoot>
    </Provider>
  );
  // After mount: the storage atoms reload from localStorage on mount, which the
  // test environment may not have, and would drop values set beforehand.
  act(() => {
    store.set(skillProfileAtom, { roleIds, selfAssessment: {} });
    store.set(skillPlanAtom, {});
  });
  return store;
};

const recommended = () => screen.getByText("Empfohlen, um Lücken zu schliessen").closest("section");
const plannedList = () => screen.getByText("Gebucht und geplant").closest("section");

describe("SkillGapPanel", () => {
  it("asks for a profile while no job is chosen", () => {
    const store = renderPanel({ roleIds: [] });
    fireEvent.click(screen.getByRole("button", { name: "Profil anlegen" }));
    expect(store.get(skillWizardAtom)).toEqual({ open: true, step: 0 });
  });

  it("shows the jobs, the key figures and a bar per skill", async () => {
    renderPanel();
    expect(screen.getByRole("list", { name: "Deine Zieljobs" })).toHaveTextContent("Product Owner");
    expect(screen.getByText("deiner Lücken deckt der Plan ab")).toBeInTheDocument();
    // Every skill the job asks for gets a row.
    const role = ROLES.find((r) => r.id === "product-owner");
    expect(await screen.findByText(SKILLS[role.essential[0]].label)).toBeInTheDocument();
    expect(screen.getAllByText(/^heute/)).toHaveLength(new Set([...role.essential, ...role.optional]).size);
    expect(screen.getByRole("button", { name: "Profil nachschärfen" })).toBeInTheDocument();
  });

  it("lets the student assess a skill and clear it again", async () => {
    const store = renderPanel();
    const role = ROLES.find((r) => r.id === "product-owner");
    const id = role.essential[0];
    const group = await screen.findByRole("group", { name: `Selbsteinschätzung ${SKILLS[id].label}` });
    const basic = within(group).getByRole("button", { name: "Grundlagen" });

    fireEvent.click(basic);
    expect(basic).toHaveAttribute("aria-pressed", "true");
    expect(store.get(skillProfileAtom).selfAssessment).toEqual({ [id]: "basic" });

    fireEvent.click(within(group).getByRole("button", { name: "Sicher" }));
    expect(store.get(skillProfileAtom).selfAssessment).toEqual({ [id]: "solid" });

    fireEvent.click(within(group).getByRole("button", { name: "Sicher" }));
    expect(store.get(skillProfileAtom).selfAssessment).toEqual({});
  });

  it("plans a recommended course and removes it again", async () => {
    const store = renderPanel();
    fireEvent.click(await within(recommended()).findByRole("button", { name: "+ Planen" }));

    expect(store.get(skillPlanAtom)).toEqual({ HS26: ["7,002,1.00"] });
    expect(within(plannedList()).getByText("Design Thinking")).toBeInTheDocument();
    expect(within(plannedList()).getByText(/· geplant$/)).toBeInTheDocument();
    expect(screen.getByText("1 geplante Kurs bereit fürs Bidding")).toBeInTheDocument();
    expect(within(recommended()).getByText("Alle passenden Kurse sind eingeplant.")).toBeInTheDocument();

    fireEvent.click(within(plannedList()).getByRole("button", { name: "Entfernen" }));
    expect(store.get(skillPlanAtom)).toEqual({ HS26: [] });
    expect(screen.getByText("Keine neuen Kurse in der Planung")).toBeInTheDocument();
  });

  it("hands the plan over to bidding", async () => {
    const store = renderPanel();
    fireEvent.click(await within(recommended()).findByRole("button", { name: "+ Planen" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Plan ins Bidding übernehmen" }));
    });

    expect(addOrRemoveCourse).toHaveBeenCalledWith(COURSE);
    expect(store.get(skillPlanAtom)).toEqual({ HS26: [] });
    expect(screen.getByText("Ins Bidding übernommen")).toBeInTheDocument();
  });

  it("keeps the plan when nobody is logged in", async () => {
    const store = renderPanel({ loggedIn: false });
    fireEvent.click(await within(recommended()).findByRole("button", { name: "+ Planen" }));
    fireEvent.click(screen.getByRole("button", { name: "Plan ins Bidding übernehmen" }));

    expect(addOrRemoveCourse).not.toHaveBeenCalled();
    expect(screen.getByText("Bitte melde dich an")).toBeInTheDocument();
    expect(store.get(skillPlanAtom)).toEqual({ HS26: ["7,002,1.00"] });
  });
});
