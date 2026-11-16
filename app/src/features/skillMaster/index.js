// Public surface of the Skill-Master feature. Biddit2 files import from here only.
import { lazyWithReload } from "../../components/helpers/lazyWithReload";

export { default as CourseSkillChips } from "./components/CourseSkillChips";
export { default as MatchRing } from "./components/MatchRing";
// Course details only: loaded with the details (render inside <Suspense>), so the
// main bundle, which imports this file for the course list, does not carry them.
export const CourseSkillFit = lazyWithReload(() => import("./components/CourseSkillFit"));
export const CourseSkillTable = lazyWithReload(() => import("./components/CourseSkillTable"));
// Skill Mapper mode only (render inside <Suspense>): the profile card with the guided journey.
export const SkillMapperHeader = lazyWithReload(() => import("./components/SkillMapperHeader"));
export { default as SkillProfileWizardHost } from "./components/wizard/SkillProfileWizardHost";
export { MATCH_THRESHOLD } from "./domain/match";
export { onlyStrongMatchAtom, useSkillMatch } from "./state/skillMasterState";
