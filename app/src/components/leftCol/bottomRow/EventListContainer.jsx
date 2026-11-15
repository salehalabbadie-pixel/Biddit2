/**
 * EventListContainer Component - SIMPLIFIED VERSION
 *
 * Displays a virtualized list of university courses with simplified data flow.
 *
 * SIMPLIFIED CHANGES:
 * - Receives termListObject instead of complex selectedSemesterState
 * - Uses unified course selectors directly for course display
 * - Removes legacy index-based logic and intermediate states
 * - Only updates unifiedCourseDataAtom through unified hooks
 *
 * NEW FLOW:
 * 1. Receives termListObject from parent (from useTermSelection)
 * 2. Uses useEventListDataManager for data coordination
 * 3. Gets filtered courses directly from unified course selectors
 * 4. Displays courses using existing Row component logic
 */

import PropTypes from "prop-types";
import { useRecoilState, useRecoilValue } from "recoil";
import { Suspense, memo, useEffect, useMemo, useRef } from "react";
import { authTokenState } from "../../recoil/authAtom";
import { VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import LoadingText from "../../common/LoadingText";

// DnD Kit for drag-and-drop to CurriculumMap
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Simplified data management hooks
import { useEventListDataManager } from "../../helpers/useEventListDataManager";
import { useCourseSelection } from "../../helpers/useCourseSelection";
import { useOpenCourseDetails } from "../../helpers/useOpenCourseDetails";

// Unified course selectors - PRIMARY DATA SOURCE
import {
  filteredCoursesSelector,
  selectedCoursesSelector,
  smartSearchResultsSelector,
  smartSearchActiveSelector,
  myCoursesSelector,
  selectedCourseInfoSelector,
} from "../../recoil/unifiedCourseDataSelectors";
import { sameCourse } from "../../../domain/course";
import { smartSearchState } from "../../recoil/smartSearchAtom";
import {
  examPlanSelector,
  plannedExamsSelector,
} from "../../recoil/examScheduleSelectors";
import {
  describeExamClashes,
  examClashes,
  isPlannedCourse,
} from "../../helpers/examScheduleUtils";

// Icons
import { ExclamationIcon, PlusIcon } from "@heroicons/react/outline";
import { StarIcon } from "@heroicons/react/solid";
import { Tooltip as ReactTooltip } from "react-tooltip";

// Custom components
import { LockClosed } from "./LockClosed";
import { LockOpen } from "./LockOpen";

// Recoil state
import { isLeftViewVisible } from "../../recoil/isLeftViewVisible";
import { formatEcts, toEcts } from "../../../domain/credits";
import { useAtomValue } from "jotai";
import {
  CourseSkillChips,
  MATCH_THRESHOLD,
  MatchRing,
  onlyStrongMatchAtom,
  useSkillMatch,
} from "../../../features/skillMaster";

// Stable fallback so an empty selector result does not invalidate itemData.
const NO_ITEMS = [];

// Row heights incl. the 10 px gap: the Skill Mapper row adds the skill line.
const ROW_HEIGHT = 75;
const SKILL_ROW_HEIGHT = 108;
const DIVIDER_HEIGHT = 32;

// Skill Mapper: list entry that separates the courses under 50 % match.
const DIVIDER = Object.freeze({ divider: true });

const DividerRow = ({ style }) => (
  <div
    style={style}
    role="separator"
    className="flex items-center gap-3 pb-2.5 text-xs text-gray-500"
  >
    <span className="flex-1 h-px bg-gray-300" />
    Unter {MATCH_THRESHOLD} % Match zu deinen Zieljobs
    <span className="flex-1 h-px bg-gray-300" />
  </div>
);

DividerRow.propTypes = {
  style: PropTypes.object.isRequired,
};

// filteredCoursesSelector and smartSearchResultsSelector attach `selected`.
function isEventOrNestedCourseSelected(event) {
  return event.selected || false;
}

// Row renderer, module scope so react-window keeps row identity across renders.
// Includes drag capability for CurriculumMap integration.
const Row = memo(function Row({ index, style, data }) {
  const entry = data.filteredCourses[index];
  const isDivider = entry === DIVIDER;
  const event = isDivider ? null : entry;
  const courseId = event?.courseNumber || event?.id || `row-${index}`;

  // useDraggable hook for drag-and-drop (must be called unconditionally)
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `eventlist-${courseId}`,
      data: {
        type: "eventlist-course",
        course: event,
        semesterKey: data.selectedSemesterShortName,
      },
      disabled: !event, // Disable dragging if no event
    });

  // Early return after hooks
  if (isDivider) return <DividerRow style={style} />;
  if (!event) {
    return null;
  }

  // Apply transform during drag
  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform) }
    : {};

  const isSelected = isEventOrNestedCourseSelected(event);

  // For projected semesters, we should not show any enrolled courses as locked
  const isEnrolled = event.enrolled && !data.selectedSemester?.isProjected;

  // For projected semesters, check if course was previously enrolled (for visual indication)
  const wasPreviouslyEnrolled =
    event.enrolled && data.selectedSemester?.isProjected;

  // A browsed course warns too, in "would clash" wording: the exam plan
  // itself tells students not to bid on courses whose exams clash.
  const examClash = describeExamClashes(
    examClashes(data.plannedExams, data.examPlan, event),
    isPlannedCourse(data.myCourses, event)
  );

  // Skill Mapper only: { match, skills } or null when the course has no skill data.
  const skillResult = data.matchFor ? data.matchFor(event) : null;
  // The course whose details are open gets a green frame.
  const isOpen = Boolean(data.openedCourse) && sameCourse(event, data.openedCourse);
  // Below the divider: greyed, like the rest of the list under 50 % match.
  const isWeak = data.weakFrom >= 0 && index > data.weakFrom;

  return (
    <div
      ref={setNodeRef}
      key={index}
      data-testid="course-list-row"
      className={`flex w-full h-full overflow-visible pb-2.5 ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ ...style, ...dragStyle }}
      title={
        wasPreviouslyEnrolled
          ? "This course was enrolled in a previous semester and probably should not be taken again unless retaking"
          : ""
      }
    >
      {/* Course Info - draggable area */}
      <div
        {...listeners}
        {...attributes}
        aria-current={isOpen ? "true" : undefined}
        onClick={() => {
          data.openCourseDetails(event, { source: "course-list" });
          data.setIsLeftViewVisibleState(false);
        }}
        className={`flex-1 py-2 pl-3 pr-4 rounded-lg shadow-sm overflow-hidden cursor-grab hover:shadow-md transition duration-500 ease-in-out ${
          wasPreviouslyEnrolled
            ? "bg-gray-100 text-gray-500"
            : isWeak
            ? "bg-gray-50 text-gray-500"
            : "bg-white text-gray-800"
        } ${isOpen ? "ring-2 ring-inset ring-hsg-600" : ""} ${isDragging ? "cursor-grabbing" : ""}`}
      >
        <div className="flex items-center gap-1 pb-2 font-semibold">
          <p className="min-w-0 truncate">
            {event.shortName ? event.shortName : "Loading..."}
          </p>
          {/* Next to the name rather than in the metadata grid below, which
              has no spare column. Distinct from the lock, which carries the
              lecture-overlap signal. heroicons hide their icons from
              assistive technology; this one is the clash's only carrier. */}
          {examClash && (
            <ExclamationIcon
              role="img"
              aria-hidden={false}
              aria-label={examClash.label}
              className="flex-shrink-0 ml-auto w-4 h-4 text-danger"
              data-tooltip-id="course-list-tooltip"
              data-tooltip-content={examClash.label}
              // The red every dark exam tooltip uses. Important, because
              // react-tooltip injects its dark variant's white after our
              // stylesheet.
              data-tooltip-class-name="!text-red-300"
            />
          )}
        </div>
        {/* Below xl the twelfth-columns are narrower than the rating and the
            ECTS figure, so the line becomes a flex row: both keep their
            width and only the classification truncates. */}
        <div
          className={`text-xs flex gap-x-2 xl:grid xl:grid-cols-12 xl:gap-x-0 ${
            wasPreviouslyEnrolled ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {event && event.avgRating && (
            <p className="flex shrink-0 whitespace-nowrap col-span-2">
              <StarIcon
                width={12}
                color={wasPreviouslyEnrolled ? "#9CA3AF" : "#006625"}
              />{" "}
              {event.avgRating}
            </p>
          )}
          <p className="hidden shrink-0 whitespace-nowrap col-span-2 xl:truncate md:block">
            {event ? `${formatEcts(toEcts(event.credits))} ECTS` : "NA"}
          </p>
          <p className="min-w-0 col-span-8 truncate">
            {event ? `${event.classification}` : "NA"}
          </p>
        </div>
        {data.matchFor && (
          <div className="pt-2">
            {skillResult ? (
              <CourseSkillChips skills={skillResult.skills} />
            ) : (
              <p className="text-xs text-gray-400">Noch keine Skill-Daten</p>
            )}
          </div>
        )}
      </div>

      {/* Skill Mapper: the match gets its own box between course and lock. */}
      {data.matchFor && (
        <div
          className={`flex shrink-0 justify-center items-center h-full w-custom64 md:w-12 xl:w-custom64 ml-3 md:ml-2 xl:ml-3 rounded-lg shadow-sm ${
            wasPreviouslyEnrolled ? "bg-gray-100" : "bg-white"
          }`}
        >
          <MatchRing
            match={skillResult?.match ?? null}
            reason={
              skillResult
                ? "Wähle einen Zieljob, um deinen Match zu sehen"
                : "Für diesen Kurs gibt es noch keine Skill-Daten"
            }
          />
        </div>
      )}

      {/* Add/Remove Button */}
      <button
        id="select_course"
        onClick={() => data.addOrRemoveCourse(event)}
        disabled={isEnrolled}
        data-tooltip-id={isEnrolled ? "course-list-tooltip" : undefined}
        data-tooltip-content={isEnrolled ? "You are already enrolled in this course" : undefined}
        className={`flex justify-center items-center h-full w-custom64 md:w-12 xl:w-custom64 shadow-sm rounded-lg ml-3 md:ml-2 xl:ml-3 transition duration-500 ease-in-out ${
          wasPreviouslyEnrolled
            ? "bg-gray-100 border-gray-300 text-gray-400"
            : "bg-white"
        } ${
          event.overlapping
            ? "border-warning text-warning cursor-pointer hover:shadow-md"
            : isEnrolled
            ? "border-main text-main cursor-not-allowed"
            : isSelected
            ? "border-main text-main cursor-pointer hover:shadow-md"
            : "hover:shadow-md"
        }`}
      >
        {isEnrolled ? (
          <LockClosed clg="w-6 h-6 " event={event} />
        ) : isSelected ? (
          <LockOpen clg="w-6 h-6 " event={event} />
        ) : (
          <PlusIcon
            className={`w-6 h-6 ${
              wasPreviouslyEnrolled ? "text-gray-400" : "text-gray-800"
            }`}
          />
        )}
      </button>
    </div>
  );
});

Row.propTypes = {
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
};

const LoadingRow = ({ style }) => (
  <div style={style} className="flex items-center justify-center">
    <LoadingText>Loading courses...</LoadingText>
  </div>
);

LoadingRow.propTypes = {
  style: PropTypes.object.isRequired,
};

const NoCoursesRow = ({ style }) => (
  <div
    style={style}
    className="flex flex-col items-center justify-center space-y-2"
  >
    <p className="text-xl text-main">No matching courses found</p>
    <p className="text-sm text-main">
      or they are not yet published for your selected semester
    </p>
  </div>
);

NoCoursesRow.propTypes = {
  style: PropTypes.object.isRequired,
};

export default function EventListContainer({
  termListObject,
  selectedSemesterShortName,
}) {
  // Simplified recoil state
  const authToken = useRecoilValue(authTokenState);
  const [, setIsLeftViewVisibleState] = useRecoilState(isLeftViewVisible);

  const openCourseDetails = useOpenCourseDetails();
  const openedCourse = useRecoilValue(selectedCourseInfoSelector);

  // Get selected semester object from termListObject
  const selectedSemester = termListObject?.find(
    (semester) => semester.shortName === selectedSemesterShortName
  );

  // Get selected course IDs from unified state
  const selectedCourseIds =
    useRecoilValue(selectedCoursesSelector(selectedSemesterShortName)) ||
    NO_ITEMS;

  // Use simplified data manager
  const { isLoading } = useEventListDataManager(selectedSemester, authToken);

  const filteredCourses =
    useRecoilValue(filteredCoursesSelector(selectedSemesterShortName)) ||
    NO_ITEMS;

  const { plan: examPlan } = useRecoilValue(
    examPlanSelector(selectedSemesterShortName)
  );
  const plannedExams = useRecoilValue(
    plannedExamsSelector(selectedSemesterShortName)
  );
  const myCourses = useRecoilValue(
    myCoursesSelector(selectedSemesterShortName)
  );

  // Smart (semantic) search replaces the keyword-filtered pool with vector-DB
  // matches once a query has run for the selected semester; the rows themselves
  // are identical, so add, lock, drag-to-curriculum-map and click-to-details
  // keep working.
  const smartSearch = useRecoilValue(smartSearchState);
  const smartResults = useRecoilValue(smartSearchResultsSelector);
  const smartActive = useRecoilValue(smartSearchActiveSelector);
  const displayedCourses = smartActive ? smartResults : filteredCourses;
  const isListLoading = isLoading || (smartActive && smartSearch.isLoading);

  // Skill Mapper: same rows, sorted by match to the chosen target role.
  const skillMode = smartSearch.mode === "skills";
  const { matchFor } = useSkillMatch(
    skillMode ? selectedSemesterShortName : null
  );
  // The switch «Nur ≥ 50 % Match» only bites once a role gives courses a match.
  const onlyStrongMatch = useAtomValue(onlyStrongMatchAtom);
  // Courses under 50 % follow a divider; courses without a match stay at the end.
  const { listedCourses, weakFrom } = useMemo(() => {
    if (!skillMode) return { listedCourses: displayedCourses, weakFrom: -1 };
    const score = (course) => matchFor(course)?.match ?? -1;
    const sorted = [...displayedCourses].sort((a, b) => score(b) - score(a));
    const anyMatch = sorted.length > 0 && score(sorted[0]) >= 0;
    if (!anyMatch) return { listedCourses: sorted, weakFrom: -1 };
    if (onlyStrongMatch) {
      return {
        listedCourses: sorted.filter((course) => score(course) >= MATCH_THRESHOLD),
        weakFrom: -1,
      };
    }
    const split = sorted.findIndex((course) => score(course) < MATCH_THRESHOLD);
    if (split === -1) return { listedCourses: sorted, weakFrom: -1 };
    return {
      listedCourses: [...sorted.slice(0, split), DIVIDER, ...sorted.slice(split)],
      weakFrom: split,
    };
  }, [skillMode, displayedCourses, matchFor, onlyStrongMatch]);

  // Course selection hook (simplified) - now works with unified state
  const { addOrRemoveCourse } = useCourseSelection({
    selectedCourseIds,
    setSelectedCourseIds: null, // Not needed anymore - hook will update unified state directly
    selectedSemesterShortName: selectedSemesterShortName || "",
    authToken,
  });

  // Prepare itemData for Row component (includes all needed callbacks and state)
  const itemData = useMemo(
    () => ({
      filteredCourses: listedCourses,
      matchFor: skillMode ? matchFor : null,
      weakFrom,
      openedCourse,
      selectedSemesterShortName,
      selectedSemester,
      selectedCourseIds,
      openCourseDetails,
      setIsLeftViewVisibleState,
      addOrRemoveCourse,
      examPlan,
      plannedExams,
      myCourses,
    }),
    [
      listedCourses,
      skillMode,
      matchFor,
      weakFrom,
      openedCourse,
      selectedSemesterShortName,
      selectedSemester,
      selectedCourseIds,
      openCourseDetails,
      setIsLeftViewVisibleState,
      addOrRemoveCourse,
      examPlan,
      plannedExams,
      myCourses,
    ]
  );

  // Row heights vary only through the divider; react-window caches them, so
  // the cache is dropped whenever the list or the mode changes.
  const rowHeight = skillMode ? SKILL_ROW_HEIGHT : ROW_HEIGHT;
  const listRef = useRef(null);
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [listedCourses, rowHeight, isListLoading]);
  const itemSize = (index) =>
    isListLoading
      ? ROW_HEIGHT
      : listedCourses[index] === DIVIDER
      ? DIVIDER_HEIGHT
      : rowHeight;

  const ItemRenderer = isListLoading
    ? LoadingRow
    : listedCourses.length === 0
    ? NoCoursesRow
    : Row;

  return (
    <Suspense
      fallback={<LoadingText>Loading your data from unisg.ch...</LoadingText>}
    >
      <AutoSizer>
        {({ height, width }) => (
          <VariableSizeList
            ref={listRef}
            className="overflow-auto text-sm scrollbar-hide"
            height={height}
            itemCount={isListLoading ? 1 : listedCourses.length || 1}
            itemSize={itemSize}
            estimatedItemSize={rowHeight}
            width={width}
            itemData={itemData}
          >
            {ItemRenderer}
          </VariableSizeList>
        )}
      </AutoSizer>
      {/* One instance serves every anchor of its id in the list; anchors
          carry their own data-tooltip-content (and exam clashes their red).
          The dark variant's text is already white. */}
      <ReactTooltip
        id="course-list-tooltip"
        place="top"
        effect="solid"
        style={{ zIndex: 9999, maxWidth: "min(320px, 85vw)" }}
        className="bg-gray-800 text-xs rounded px-2 py-1"
      />
    </Suspense>
  );
}

EventListContainer.propTypes = {
  termListObject: PropTypes.arrayOf(
    PropTypes.shape({
      cisId: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      shortName: PropTypes.string.isRequired,
      isCurrent: PropTypes.bool.isRequired,
      isProjected: PropTypes.bool.isRequired,
      isFuture: PropTypes.bool, // Optional property for artificially generated future semesters
    })
  ).isRequired,
  selectedSemesterShortName: PropTypes.string.isRequired,
};

export { EventListContainer };
