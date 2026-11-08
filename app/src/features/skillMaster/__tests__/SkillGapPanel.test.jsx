import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/mocks/server";
import { unifiedCourseDataState } from "../../../components/recoil/unifiedCourseDataAtom";
import SkillGapPanel from "../components/SkillGapPanel";

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

const renderPanel = () =>
  render(
    <Provider store={createStore()}>
      <RecoilRoot
        initializeState={({ set }) =>
          set(unifiedCourseDataState, (prev) => ({
            ...prev,
            selectedSemester: "HS26",
            semesters: {
              HS26: {
                available: [{ courseNumber: "7,002,1.00", shortName: "Design Thinking" }],
                selectedIds: [],
                enrolledIds: [],
              },
            },
          }))
        }
      >
        <SkillGapPanel />
      </RecoilRoot>
    </Provider>
  );

describe("SkillGapPanel", () => {
  it("proposes a course with its match once a target role is chosen", async () => {
    server.use(http.get("*/skill-master/HS26.json", () => HttpResponse.json(SKILL_FILE)));
    renderPanel();

    expect(screen.queryByText("Deine Skill-Lücken")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Product Owner" }));

    expect(screen.getByText("Deine Skill-Lücken")).toBeInTheDocument();
    expect(await screen.findByText("Design Thinking")).toBeInTheDocument();
    expect(screen.getByText("+ Merken")).toBeInTheDocument();
  });

  it("asks to bookmark courses while none is planned", () => {
    server.use(http.get("*/skill-master/HS26.json", () => HttpResponse.json(SKILL_FILE)));
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Product Owner" }));

    expect(screen.getByText(/Merke dir Kurse/)).toBeInTheDocument();
    expect(screen.queryByText(/gemerkten Kurse schliessen/)).not.toBeInTheDocument();
  });

  it("clears a self-assessment on double-click", () => {
    server.use(http.get("*/skill-master/HS26.json", () => HttpResponse.json(SKILL_FILE)));
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Product Owner" }));

    const row = within(screen.getByText("Kritisches Denken").closest("li"));
    const basic = row.getByRole("button", { name: "Grundlagen" });

    fireEvent.click(basic);
    expect(basic).toHaveAttribute("aria-pressed", "true");

    fireEvent.doubleClick(basic);
    expect(basic).toHaveAttribute("aria-pressed", "false");
    expect(row.getByRole("button", { name: "Keine" })).toHaveAttribute("aria-pressed", "false");
  });
});
