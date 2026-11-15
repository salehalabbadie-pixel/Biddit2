import { Suspense } from "react";
import { useAtomValue } from "jotai";
import { lazyWithReload } from "../../../../components/helpers/lazyWithReload";
import { skillWizardAtom } from "../../state/skillMasterState";

// Loaded on first open: the wizard and its keyword lists stay out of the main bundle.
const SkillProfileWizard = lazyWithReload(() => import("./SkillProfileWizard"));

/**
 * Mounted once on the page, so «Nachschärfen» in the course list and «Profil
 * nachschärfen» in the Skill-Gap tab open the same single wizard.
 */
export default function SkillProfileWizardHost() {
  const { open } = useAtomValue(skillWizardAtom);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <SkillProfileWizard />
    </Suspense>
  );
}
