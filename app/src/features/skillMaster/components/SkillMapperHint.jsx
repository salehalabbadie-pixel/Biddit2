import { useSkillProfile } from "../state/skillMasterState";

/** Shown under the mode toggle while «Skill Mapper» is active. */
export default function SkillMapperHint() {
  const { profile } = useSkillProfile();
  return (
    <div className="p-2 mb-1 text-xs rounded-md bg-green-50 text-gray-600">
      {profile.roleIds.length > 0 ? (
        <p>Kurse sortiert nach Match zu deiner Zielrolle.</p>
      ) : (
        <p>
          Wähle im Tab <span className="font-medium text-green-700">Skill-Gap</span>{" "}
          eine Zielrolle, dann zeigt die Liste deinen Match pro Kurs.
        </p>
      )}
    </div>
  );
}
