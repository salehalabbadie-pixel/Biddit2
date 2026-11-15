import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { RecoilRoot, useRecoilValue } from "recoil";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/mocks/server";
import { unifiedCourseDataState } from "../../../components/recoil/unifiedCourseDataAtom";
import { selectedTabAtom } from "../../../components/recoil/selectedTabAtom";
import { TAB } from "../../../constants/tabs";
import { ROLES, SKILLS } from "../data/catalog";
import CourseSkillFit from "../components/CourseSkillFit";
import CourseSkillTable from "../components/CourseSkillTable";
import { skillPlanAtom, skillProfileAtom } from "../state/skillMasterState";

const role = ROLES.find((r) => r.id === "product-owner");
const [core] = role.essential;
const other = Object.keys(SKILLS).find((id) => !role.essential.includes(id) && !role.optional.includes(id));

const SKILL_FILE = {
  schemaVersion: "1.0",
  semester: "HS26",
  courses: [
    {
      courseNumber: "7,002,1.00",
      skills: [
        { escoUri: core, contribution: 30, aiAutomation: 20, status: "extracted", evidence: "Lernziel A" },
        { escoUri: other, contribution: 10, aiAutomation: 80, status: "extracted", evidence: "Inhalt B" },
      ],
    },
  ],
};
const COURSE = { courseNumber: "7,002,1.00", shortName: "Design Thinking", credits: 400 };

const Tab = () => <output aria-label="tab">{useRecoilValue(selectedTabAtom)}</output>;

const renderCourse = ({ roleIds = [role.id], interestAreas = [], enrolled = false } = {}) => {
  server.use(http.get("*/skill-master/HS26.json", () => HttpResponse.json(SKILL_FILE)));
  const store = createStore();
  render(
    <Provider store={store}>
      <RecoilRoot
        initializeState={({ set }) =>
          set(unifiedCourseDataState, (prev) => ({
            ...prev,
            selectedSemester: "HS26",
            semesters: {
              HS26: { available: [COURSE], selectedIds: [], enrolledIds: enrolled ? [COURSE.courseNumber] : [] },
            },
          }))
        }
      >
        <CourseSkillFit course={COURSE} semester="HS26" />
        <CourseSkillTable course={COURSE} semester="HS26" />
        <Tab />
      </RecoilRoot>
    </Provider>
  );
  // After mount, as the storage atoms reload from localStorage on mount.
  act(() => {
    store.set(skillProfileAtom, { roleIds, selfAssessment: {}, interestAreas });
    store.set(skillPlanAtom, {});
  });
  return store;
};

describe("CourseSkillFit", () => {
  it("shows the fit, the gap it closes, both fits and the AI exposure", async () => {
    renderCourse();
    const card = await screen.findByTestId("course-skill-fit");
    expect(within(card).getByText(/Passung$/)).toBeInTheDocument();
    expect(within(card).getByText(`Schliesst 1 Lücke zu deinen Zieljobs, vor allem ${SKILLS[core].label}.`)).toBeInTheDocument();
    expect(within(card).getByText("Zieljob-Fit")).toBeInTheDocument();
    // No interests yet: the interest fit shows a dash and the match is the job fit.
    expect(within(card).getByText("Interessen-Fit").nextSibling.nextSibling).toHaveTextContent("–");
    expect(within(card).getByText(/Match = Zieljob-Fit/)).toBeInTheDocument();
    expect(within(card).getByText(/KI-Automatisierbarkeit \d+ %/)).toBeInTheDocument();
    expect(within(card).getByText(new RegExp(`${SKILLS[other].label} ist dagegen weitgehend automatisierbar`))).toBeInTheDocument();
  });

  it("weights interests at 40 % once the profile has some", async () => {
    renderCourse({ interestAreas: ["digital-health"] });
    const card = await screen.findByTestId("course-skill-fit");
    expect(within(card).getByText(/Match = 60 % Zieljob-Fit/)).toBeInTheDocument();
    expect(within(card).getByText("Interessen-Fit").nextSibling.nextSibling).toHaveTextContent("0%");
  });

  it("plans the course or names its status, and opens the Skill-Gap tab", async () => {
    const store = renderCourse();
    fireEvent.click(await screen.findByRole("button", { name: "+ Planen" }));
    expect(store.get(skillPlanAtom)).toEqual({ HS26: ["7,002,1.00"] });
    expect(screen.getByRole("button", { name: "Geplant" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Zur Skill-Gap-Ansicht" }));
    expect(screen.getByLabelText("tab")).toHaveTextContent(TAB.SKILL_GAP);
  });

  it("shows «Gebucht» for an enrolled course", async () => {
    renderCourse({ enrolled: true });
    expect(await screen.findByRole("button", { name: "Gebucht" })).toBeDisabled();
  });

  it("asks for a profile while no job is chosen", async () => {
    renderCourse({ roleIds: [] });
    expect(await screen.findByText("Passt der Kurs zu dir?")).toBeInTheDocument();
  });
});

describe("CourseSkillTable", () => {
  it("lists contribution, the gap closed and the AI automation per skill", async () => {
    renderCourse();
    const table = await screen.findByTestId("course-skill-table");
    const coreRow = within(table).getByText(SKILLS[core].label).closest("tr");
    expect(coreRow).toHaveTextContent("+30 Pkt.");
    expect(coreRow).toHaveTextContent(/schliesst 30 von 80 Pkt\./);
    expect(coreRow).toHaveTextContent("20 %");
    expect(coreRow).toHaveAttribute("title", "Lernziel A");
    expect(within(table).getByText(SKILLS[other].label).closest("tr")).toHaveTextContent("nicht in deinen Zieljobs");
    expect(within(table).getByText(/noch nicht bestätigt/)).toBeInTheDocument();
  });
});
