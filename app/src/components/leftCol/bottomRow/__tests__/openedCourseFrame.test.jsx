/**
 * The course whose details are open is framed in green in the course list, so
 * the student sees which course the right column shows.
 */

import { render, screen, within } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { describe, expect, it, vi } from "vitest";
import { authTokenState } from "../../../recoil/authAtom";
import { unifiedCourseDataState } from "../../../recoil/unifiedCourseDataAtom";
import EventListContainer from "../EventListContainer";

// AutoSizer measures to 0x0 in jsdom, which would render no rows at all.
vi.mock("react-virtualized-auto-sizer", () => ({
  default: ({ children }) => children({ height: 600, width: 400 }),
}));

// The data manager only coordinates fetching; the seeded atom is the fixture.
vi.mock("../../../helpers/useEventListDataManager", () => ({
  useEventListDataManager: () => ({ isLoading: false }),
}));

const SEMESTER = "HS25";

const COURSES = [
  {
    id: "ml",
    courseNumber: "7,214,1.00",
    shortName: "Machine Learning",
    classification: "Core",
    credits: 400,
  },
  {
    id: "dv",
    courseNumber: "8,180,1.00",
    shortName: "Data Visualisation",
    classification: "Elective",
    credits: 400,
  },
];

const TERM_LIST = [
  {
    cisId: "cis-hs25",
    id: "hs25",
    shortName: SEMESTER,
    isCurrent: true,
    isProjected: false,
  },
];

const seedState = ({ set }) => {
  set(authTokenState, "test-token");
  set(unifiedCourseDataState, {
    semesters: {
      [SEMESTER]: {
        enrolledIds: [],
        available: COURSES,
        selectedIds: [],
        studyPlan: [],
        lastFetched: null,
        isFutureSemester: false,
        referenceSemester: null,
        cisId: "cis-hs25",
        isCurrent: true,
        isProjected: false,
      },
    },
    selectedSemester: SEMESTER,
    latestValidTerm: SEMESTER,
    selectedCourseInfo: COURSES[1],
  });
};

const renderList = () =>
  render(
    <RecoilRoot initializeState={seedState}>
      <EventListContainer termListObject={TERM_LIST} selectedSemesterShortName={SEMESTER} />
    </RecoilRoot>
  );

describe("EventListContainer opened course", () => {
  it("frames the course whose details are open, and only that one", async () => {
    renderList();
    const rows = await screen.findAllByTestId("course-list-row");
    const card = (name) =>
      within(rows.find((row) => row.textContent.includes(name))).getByText(name).closest("[aria-current], div.flex-1");

    expect(card("Data Visualisation")).toHaveAttribute("aria-current", "true");
    expect(card("Data Visualisation").className).toMatch(/ring-hsg-600/);
    expect(card("Machine Learning")).not.toHaveAttribute("aria-current");
    expect(card("Machine Learning").className).not.toMatch(/ring-hsg-600/);
  });
});
