import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { RecoilRoot, useRecoilValue } from "recoil";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/mocks/server";
import { unifiedCourseDataState } from "../../../components/recoil/unifiedCourseDataAtom";
import { selectedTabAtom } from "../../../components/recoil/selectedTabAtom";
import { smartSearchState } from "../../../components/recoil/smartSearchAtom";
import { TAB } from "../../../constants/tabs";
import { ROLES } from "../data/catalog";
import SkillMapperHeader from "../components/SkillMapperHeader";
import SkillProfileWizardHost from "../components/wizard/SkillProfileWizardHost";
import {
  onlyStrongMatchAtom,
  skillGapFocusAtom,
  skillProfileAtom,
  skillWizardAtom,
} from "../state/skillMasterState";

const SKILL_FILE = {
  schemaVersion: "1.0",
  semester: "HS26",
  courses: [
    {
      courseNumber: "7,002,1.00",
      rootKey: "7,002",
      skills: [
        { escoUri: "customer-needs", contribution: 25, aiAutomation: 20, status: "extracted" },
        { escoUri: "prototyping", contribution: 25, aiAutomation: 35, status: "extracted" },
      ],
    },
  ],
};

const Tab = () => <output aria-label="tab">{useRecoilValue(selectedTabAtom)}</output>;
const Mode = () => <output aria-label="mode">{useRecoilValue(smartSearchState).mode}</output>;

const renderHeader = (roleIds) => {
  const store = createStore();
  server.use(http.get("*/skill-master/HS26.json", () => HttpResponse.json(SKILL_FILE)));
  render(
    <Provider store={store}>
      <RecoilRoot
        initializeState={({ set }) =>
          set(unifiedCourseDataState, (prev) => ({
            ...prev,
            selectedSemester: "HS26",
            semesters: {
              HS26: {
                available: [{ courseNumber: "7,002,1.00", shortName: "Design Thinking" }],
                selectedIds: [],
                enrolledIds: ["7,002,1.00"],
              },
            },
          }))
        }
      >
        <SkillMapperHeader />
        <SkillProfileWizardHost />
        <Tab />
        <Mode />
      </RecoilRoot>
    </Provider>
  );
  // After mount: on mount the storage atom reloads from localStorage, which the
  // test environment may not have, and would drop a profile set beforehand.
  act(() => store.set(skillProfileAtom, { roleIds, selfAssessment: {} }));
  return store;
};

describe("SkillMapperHeader", () => {
  it("highlights the card and starts the journey with the profile", () => {
    const store = renderHeader([]);
    const card = screen.getByText("Dein Skill-Profil").closest("section");
    expect(card).toHaveAttribute("data-highlight", "true");
    expect(within(card).getByText("Start hier")).toBeInTheDocument();
    expect(within(card).getByText("Starte hier: Lege dein Skill-Profil an")).toBeInTheDocument();
    fireEvent.click(within(card).getByRole("button", { name: "Profil anlegen →" }));
    expect(store.get(skillWizardAtom).open).toBe(true);
    expect(screen.getByRole("switch", { name: /Nur ≥ 50 % Match/ })).toBeDisabled();
  });

  it("shows the roles and the profile figures", async () => {
    const role = ROLES.find((r) => r.label === "Product Owner");
    renderHeader([role.id]);

    expect(screen.getByRole("list", { name: "Deine Zieljobs" })).toHaveTextContent("Product Owner");
    expect(screen.getByText(/Sortiert nach Match zu 1 Zieljob$/)).toBeInTheDocument();
    expect(await screen.findByText(/Lücken gedeckt/)).toBeInTheDocument();

    // The enrolled course trains these skills of the role.
    const inRole = new Set([...role.essential, ...(role.optional || [])]);
    const verified = ["customer-needs", "prototyping"].filter((id) => inRole.has(id)).length;
    expect(await screen.findByText(/verifizierte Skills/)).toHaveTextContent(`${verified} verifizierte Skills`);
  });

  it("leads to the recommendations once the profile exists", async () => {
    const store = renderHeader([ROLES[0].id]);
    expect(screen.queryByText("Start hier")).not.toBeInTheDocument();
    expect(await screen.findByText("Nächster Schritt: Kurse wählen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Empfehlungen ansehen →" }));
    expect(screen.getByLabelText("tab")).toHaveTextContent(TAB.SKILL_GAP);
    expect(store.get(skillGapFocusAtom)).toBe("recommendations");
  });

  it("toggles «Nur ≥ 50 % Match» from the switch or its label", () => {
    const store = renderHeader([ROLES[0].id]);
    const toggle = screen.getByRole("switch", { name: /Nur ≥ 50 % Match/ });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(store.get(onlyStrongMatchAtom)).toBe(true);

    fireEvent.click(screen.getByText("Nur ≥ 50 % Match"));
    expect(store.get(onlyStrongMatchAtom)).toBe(false);
  });

  it("opens the Skill-Gap tab at the job choice for «Skill-Gap →»", () => {
    const store = renderHeader([ROLES[0].id]);
    fireEvent.click(screen.getByRole("button", { name: "Skill-Gap →" }));
    expect(screen.getByLabelText("tab")).toHaveTextContent(TAB.SKILL_GAP);
    expect(store.get(skillGapFocusAtom)).toBe("roles");
  });

  it("explains how to copy the text when a job ad link is pasted", async () => {
    const store = renderHeader([ROLES[0].id]);
    fireEvent.click(screen.getByRole("button", { name: "Nachschärfen" }));
    const field = await screen.findByLabelText("Stellenanzeige", {}, { timeout: 5000 });
    expect(screen.getByText(/markiere den Text mit/)).toBeInTheDocument();

    const url = "https://www.jobs.ch/de/stellenangebote/detail/123/";
    fireEvent.change(field, { target: { value: url } });
    fireEvent.click(screen.getByRole("button", { name: "Analysieren" }));
    expect(screen.getByText("Links kann Biddit nicht selbst lesen.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Öffne die Anzeige ↗" })).toHaveAttribute("href", url);
    expect(store.get(skillProfileAtom).customRoles ?? []).toHaveLength(0);
  });

  it("walks through the wizard from «Nachschärfen» to the course list", async () => {
    const store = renderHeader([ROLES[0].id]);
    fireEvent.click(screen.getByRole("button", { name: "Nachschärfen" }));
    // The wizard loads on first open; under a busy test run that can take a while.
    expect(
      await screen.findByText("Für welche Jobs interessierst du dich?", {}, { timeout: 5000 })
    ).toBeInTheDocument();

    // A typed job title selects the catalogue job it names.
    fireEvent.change(screen.getByLabelText("Jobtitel"), { target: { value: "Product Owner" } });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(screen.getByText("«Product Owner» gewählt.")).toBeInTheDocument();

    // A pasted job ad becomes an own job with the skills it mentions.
    fireEvent.change(screen.getByLabelText("Stellenanzeige"), {
      target: { value: "Venture Analyst\nDu führst Due Diligence durch und erstellst Finanzmodelle." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analysieren" }));
    const custom = store.get(skillProfileAtom).customRoles;
    expect(custom).toHaveLength(1);
    expect(custom[0]).toMatchObject({ label: "Venture Analyst", source: "ad" });
    expect(custom[0].essential).toEqual(expect.arrayContaining(["investment-analysis", "financial-modelling"]));
    expect(store.get(skillProfileAtom).roleIds).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Was hast du schon gemacht?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Was interessiert dich inhaltlich?")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Eigenes Interesse"), { target: { value: "Nachhaltigkeit" } });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(store.get(skillProfileAtom).interestSkills).toContain("circular-economy");

    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Dein Skill-Profil", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText(/von \d+ Skills, die deine Zieljobs verlangen/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zu meinen Kursvorschlägen" }));
    expect(screen.queryByTestId("skill-profile-wizard")).not.toBeInTheDocument();
    expect(screen.getByLabelText("mode")).toHaveTextContent("skills");
  });
});
